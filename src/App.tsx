import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Sidebar } from './components/Sidebar';
import { Toaster } from './components/ui/sonner';

export interface User {
  id: string;
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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tts-app-user');
    const savedHistory = localStorage.getItem('tts-app-speech-history');
    const savedConversations = localStorage.getItem('tts-app-conversations');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      userData.createdAt = new Date(userData.createdAt);
      setUser(userData);
      setCurrentScreen(userData ? 'home' : 'auth');
    }

    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setSpeechHistory(history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }

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
  }, []);

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
          const response = await fetch(`/api/member/${user.id}/preferences`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preferSubject: preferSubject.trim(),
            }),
          });

          console.log('관심 주제 업데이트 요청:', { 
            memberNum: user.id, 
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

  const handleToggleFavorite = (id: string) => {
    const updatedHistory = speechHistory.map(record =>
      record.id === id ? { ...record, isFavorite: !record.isFavorite } : record
    );
    saveSpeechHistory(updatedHistory);
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

  const handleEndConversation = () => {
    if (currentConversation) {
      const updatedConversations = [currentConversation, ...conversations];
      saveConversations(updatedConversations);
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