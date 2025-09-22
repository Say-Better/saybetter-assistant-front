import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Sidebar } from './components/Sidebar';
import { Toaster } from './components/ui/sonner';

export interface User {
  id: string;
  memberNum: number | string;  // 로그인 응답에서 문자열로 올 수 있음
  name: string;
  characteristics: string;
  createdAt: Date;
}

export interface SpeechRecord {
  id: string;
  text: string;
  timestamp: Date;
  isFavorite: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'response';
  text: string;
  timestamp: Date;
}

type Screen = 'auth' | 'onboarding' | 'home' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [speechHistory, setSpeechHistory] = useState<SpeechRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const startMicRecordingCallbackRef = useRef<(() => void) | null>(null);

  // API에서 즐겨찾기 불러오기
  const loadBookmarksFromAPI = useCallback(async () => {
    try {
      if (!user) {
        console.log('사용자가 로그인되어 있지 않아 즐겨찾기를 불러오지 않습니다.');
        return;
      }
      
      console.log('즐겨찾기 로드 시작 - 사용자 정보:', user);

      const memberNum = typeof user.memberNum === 'string' ? parseInt(user.memberNum, 10) : user.memberNum;
      console.log('즐겨찾기 불러오기 시작: /api/statements/' + memberNum + '/bookmark');
      const response = await fetch(`/api/statements/${memberNum}/bookmark`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`즐겨찾기 불러오기 실패: ${response.status}`);
      }

      const apiBookmarks = await response.json();
      console.log('API 즐겨찾기 응답:', apiBookmarks);
      
      // API 응답을 SpeechRecord 형식으로 변환
      const formattedBookmarks: SpeechRecord[] = apiBookmarks
        .filter((bookmark: any) => bookmark.bookmark === 1) // bookmark가 1인 것만 필터링
        .map((bookmark: any) => ({
          id: bookmark.statementNum?.toString() || Date.now().toString(),
          text: bookmark.content || '',
          timestamp: new Date(bookmark.createdAt || Date.now()),
          isFavorite: true // 즐겨찾기에서 불러온 것이므로 항상 true
        }));

      // 기존 로컬 speechHistory와 병합 (즐겨찾기가 아닌 것만)
      setSpeechHistory(prevHistory => {
        const existingHistory = prevHistory.filter(record => !record.isFavorite);
        const mergedHistory = [...formattedBookmarks, ...existingHistory];
        
        // localStorage에도 저장
        localStorage.setItem('tts-app-speech-history', JSON.stringify(mergedHistory));
        
        return mergedHistory;
      });
      
      console.log('즐겨찾기 불러오기 완료:', formattedBookmarks.length + '개');
    } catch (error) {
      console.error('즐겨찾기 불러오기 오류:', error);
      // 오류 발생 시에도 기존 localStorage 데이터는 유지
    }
  }, [user]);

  // API에서 대화 기록 불러오기
  const loadConversationsFromAPI = useCallback(async () => {
    try {
      if (!user) {
        console.log('사용자가 로그인되어 있지 않아 대화 기록을 불러오지 않습니다.');
        return;
      }
      
      console.log('대화 기록 로드 시작 - 사용자 정보:', user);

      const memberNum = typeof user.memberNum === 'string' ? parseInt(user.memberNum, 10) : user.memberNum;
      console.log('대화 기록 불러오기 시작: /api/conversation?memberNum=' + memberNum);
      const response = await fetch(`/api/conversation?memberNum=${memberNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`대화 기록 불러오기 실패: ${response.status}`);
      }

      const apiConversations = await response.json();
      
      // API 응답을 Conversation 형식으로 변환
      const formattedConversations: Conversation[] = apiConversations.map((apiConv: any) => ({
        id: apiConv.conversationNum.toString(),
        title: apiConv.content.substring(0, 30) + (apiConv.content.length > 30 ? '...' : ''),
        timestamp: new Date(apiConv.createdAt),
        messages: [{
          id: `${apiConv.conversationNum}_initial`,
          type: 'user' as const,
          text: apiConv.content,
          timestamp: new Date(apiConv.createdAt)
        }]
      }));

      setConversations(formattedConversations);
      // localStorage에도 저장
      localStorage.setItem('tts-app-conversations', JSON.stringify(formattedConversations));
    } catch (error) {
      console.error('대화 기록 불러오기 오류:', error);
      // 오류 발생 시 localStorage에서 불러오기
      const savedConversations = localStorage.getItem('tts-app-conversations');
      if (savedConversations) {
        const convs = JSON.parse(savedConversations);
        setConversations(convs.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
      }
    }
  }, [user]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tts-app-user');
    const savedHistory = localStorage.getItem('tts-app-speech-history');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      userData.createdAt = new Date(userData.createdAt);
      setUser(userData);
      setCurrentScreen(userData ? 'home' : 'auth');
      
      // 사용자가 로그인되어 있으면 useEffect에서 API 호출할 예정
    } else {
      // 로그인되지 않은 경우에만 localStorage에서 대화 기록 불러오기
      const savedConversations = localStorage.getItem('tts-app-conversations');
      if (savedConversations) {
        const convs = JSON.parse(savedConversations);
        setConversations(convs.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
      }
    }

    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setSpeechHistory(history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  // 사용자가 로그인/로그아웃될 때 API 데이터 로드
  useEffect(() => {
    if (user && user.memberNum) {
      console.log('사용자 상태 변경됨, API 데이터 로드:', user.id, 'memberNum:', user.memberNum);
      loadConversationsFromAPI();
      loadBookmarksFromAPI();
    }
  }, [user?.id, user?.memberNum, loadConversationsFromAPI, loadBookmarksFromAPI]);

  // Save data to localStorage
  const saveUserData = (userData: User) => {
    localStorage.setItem('tts-app-user', JSON.stringify(userData));
    setUser(userData);
  };

  const saveSpeechHistory = (history: SpeechRecord[]) => {
    localStorage.setItem('tts-app-speech-history', JSON.stringify(history));
    setSpeechHistory(history);
  };

  const saveConversations = (convs: Conversation[]) => {
    localStorage.setItem('tts-app-conversations', JSON.stringify(convs));
    setConversations(convs);
  };

  const handleLogin = (userData: User) => {
    saveUserData(userData);
    setCurrentScreen('home');
  };

  const handleSignup = (userData: User) => {
    saveUserData(userData);
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = async (characteristics: string, preferSubject?: string) => {
    if (user) {
      try {
        // 관심 주제 업데이트 API 호출
        if (preferSubject?.trim()) {
          const memberNum = typeof user.memberNum === 'string' ? parseInt(user.memberNum, 10) : user.memberNum;
          const response = await fetch(`/api/member/${memberNum}/preferences`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preferSubject: preferSubject.trim(),
            }),
          });

          console.log('관심 주제 업데이트 요청:', { 
            memberNum: memberNum, 
            preferSubject: preferSubject.trim() 
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('관심 주제 업데이트 실패:', response.status, errorData);
          } else {
            console.log('관심 주제 업데이트 성공');
          }
        }

        // 로컬 사용자 정보 업데이트
        const updatedUser = { ...user, characteristics };
        saveUserData(updatedUser);
        setCurrentScreen('home');
      } catch (error) {
        console.error('온보딩 완료 처리 중 오류:', error);
        // 에러가 발생해도 앱 사용은 계속할 수 있도록 함
        const updatedUser = { ...user, characteristics };
        saveUserData(updatedUser);
        setCurrentScreen('home');
      }
    }
  };

  const handleAddSpeechRecord = (text: string) => {
    const newRecord: SpeechRecord = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isFavorite: false
    };
    saveSpeechHistory([newRecord, ...speechHistory]);
  };

  const handleToggleFavorite = async (id: string) => {
    const record = speechHistory.find(r => r.id === id);
    if (!record || !user) {
      // 로컬에서만 업데이트
      const updatedHistory = speechHistory.map(record =>
        record.id === id ? { ...record, isFavorite: !record.isFavorite } : record
      );
      saveSpeechHistory(updatedHistory);
      return;
    }

    try {
      // 즐겨찾기 토글 PATCH API 호출
      const newBookmarkValue = record.isFavorite ? 0 : 1; // 제거: 0, 추가: 1
      console.log('즐겨찾기 토글 시도:', { 
        statementNum: id, 
        memberNum: user.memberNum, 
        bookmark: newBookmarkValue 
      });
      
      const response = await fetch(`/api/statements/${id}/bookmark`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookmark: newBookmarkValue
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('즐겨찾기 토글 실패:', response.status, errorText);
        return;
      }
      console.log('즐겨찾기 토글 성공:', newBookmarkValue === 1 ? '추가' : '제거');

      // API 호출 성공 시 로컬 상태 업데이트
      const updatedHistory = speechHistory.map(record =>
        record.id === id ? { ...record, isFavorite: !record.isFavorite } : record
      );
      saveSpeechHistory(updatedHistory);
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
      // 에러 발생 시에도 로컬 상태는 업데이트
      const updatedHistory = speechHistory.map(record =>
        record.id === id ? { ...record, isFavorite: !record.isFavorite } : record
      );
      saveSpeechHistory(updatedHistory);
    }
  };

  const handleStartConversation = (initialText: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: initialText.substring(0, 30) + (initialText.length > 30 ? '...' : ''),
      timestamp: new Date(),
      messages: [{
        id: Date.now().toString(),
        type: 'user',
        text: initialText,
        timestamp: new Date()
      }]
    };
    setCurrentConversation(newConversation);
    setIsListening(true);
  };

  const handleAddConversationMessage = (text: string, type: 'user' | 'response') => {
    if (currentConversation) {
      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        type,
        text,
        timestamp: new Date()
      };
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, newMessage]
      };
      setCurrentConversation(updatedConversation);
    }
  };

  // API에 대화 저장하기
  const saveConversationToAPI = async (conversation: Conversation) => {
    try {
      // 사용자가 로그인되어 있지 않으면 저장하지 않음
      if (!user) {
        console.log('사용자가 로그인되어 있지 않아 대화를 저장하지 않습니다.');
        return;
      }
      
      // 데이터 검증
      if (!user.memberNum || user.memberNum === 0) {
        console.error('유효하지 않은 memberNum:', user.memberNum);
        return;
      }

      if (!conversation.messages || conversation.messages.length === 0) {
        console.error('저장할 메시지가 없습니다:', conversation.messages);
        return;
      }

      const requestBody = {
        memberNum: typeof user.memberNum === 'string' ? parseInt(user.memberNum, 10) : user.memberNum,
        contents: conversation.messages.map(message => ({
          content: message.text,
          speaker: message.type === 'user' ? 'M' : 'O'  // M: TTS(사용자 발화), O: 녹음(AI 응답)
        }))
      };
      
      console.log('사용자 정보 확인:', { 
        userId: user.id,
        memberNum: user.memberNum,
        memberNumType: typeof user.memberNum
      });
      console.log('대화 정보 확인:', {
        conversationId: conversation.id,
        messageCount: conversation.messages.length,
        messages: conversation.messages
      });
      console.log('대화 저장 시작: /api/conversation/save', requestBody);
      console.log('전송할 contents 상세:', JSON.stringify(requestBody.contents, null, 2));
      
      const response = await fetch('/api/conversation/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('에러 응답:', errorText);
        throw new Error(`대화 저장 실패: ${response.status} - ${errorText}`);
      }

      console.log('대화가 API에 저장되었습니다.');
    } catch (error) {
      console.error('대화 저장 오류:', error);
    }
  };

  const handleEndConversation = () => {
    if (currentConversation) {
      const updatedConversations = [currentConversation, ...conversations];
      saveConversations(updatedConversations);
      
      // API에도 저장
      saveConversationToAPI(currentConversation);
      
      setCurrentConversation(null);
      setIsListening(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSidebarOpen(false);
  };

  const handleTTSStart = () => {
    // TTS 시작 후 0.5초 딜레이로 마이크 녹음 시작
    // 상태 업데이트를 기다리기 위해 약간의 딜레이 추가
    setTimeout(() => {
      // 콜백이 등록될 때까지 최대 2초간 기다림
      const tryStartRecording = (attempts = 0) => {
        // 콜백이 있으면 항상 실행 (첫 번째 발화도 포함)
        if (startMicRecordingCallbackRef.current) {
          setTimeout(() => {
            startMicRecordingCallbackRef.current?.();
          }, 500);
        } else if (attempts < 20) { // 2초 동안 0.1초 간격으로 재시도
          setTimeout(() => tryStartRecording(attempts + 1), 100);
        }
      };
      
      tryStartRecording();
    }, 100); // 상태 업데이트를 위한 100ms 딜레이
  };

  const handleSetMicRecordingCallback = useCallback((callback: () => void) => {
    startMicRecordingCallbackRef.current = callback;
  }, []);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'home':
        return (
          <HomeScreen
            user={user!}
            speechHistory={speechHistory}
            currentConversation={currentConversation}
            isListening={isListening}
            onAddSpeechRecord={handleAddSpeechRecord}
            onToggleFavorite={handleToggleFavorite}
            onStartConversation={handleStartConversation}
            onAddConversationMessage={handleAddConversationMessage}
            onEndConversation={handleEndConversation}
            onOpenSettings={() => setCurrentScreen('settings')}
            onOpenSidebar={() => setSidebarOpen(true)}
            onTTSStart={handleTTSStart}
            onSetMicRecordingCallback={handleSetMicRecordingCallback}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            user={user!}
            onUpdateUser={saveUserData}
            onBack={() => setCurrentScreen('home')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex">
      <Sidebar
        conversations={conversations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
      <div className="flex-1 overflow-hidden">
        {renderCurrentScreen()}
      </div>
      <Toaster />
    </div>
  );
}