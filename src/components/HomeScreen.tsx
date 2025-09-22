import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { User, SpeechRecord, Conversation } from '../App';
import { SpeechHistoryList } from './SpeechHistoryList';
import { SpeechSuggestionTabs } from './SpeechSuggestionTabs';
import { TextToSpeechInput } from './TextToSpeechInput';
import { ConversationPanel } from './ConversationPanel';
import { Menu, Settings, MessageSquare, Mic } from 'lucide-react';

interface HomeScreenProps {
  user: User;
  speechHistory: SpeechRecord[];
  currentConversation: Conversation | null;
  isListening: boolean;
  onAddSpeechRecord: (text: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartConversation: (text: string) => void;
  onAddConversationMessage: (text: string, type: 'user' | 'response') => void;
  onEndConversation: () => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  onTTSStart: () => void;
  onSetMicRecordingCallback: (callback: () => void) => void;
}

export function HomeScreen({
  user,
  speechHistory,
  currentConversation,
  isListening,
  onAddSpeechRecord,
  onToggleFavorite,
  onStartConversation,
  onAddConversationMessage,
  onEndConversation,
  onOpenSettings,
  onOpenSidebar,
  onTTSStart,
  onSetMicRecordingCallback
}: HomeScreenProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Generate AI suggestions based on conversation context
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
      if (lastMessage.type === 'response') {
        // Generate contextual suggestions using GPT API
        generateGPTSuggestions();
      }
    } else {
      // Generate general suggestions based on user characteristics
      generateGPTSuggestions();
    }
  }, [currentConversation, user.preferSubject, user.characteristics]);

  // OpenAI GPT API를 통한 AI 추천 생성
  const generateGPTSuggestions = async () => {
    setIsLoadingSuggestions(true);
    
    // API 키 확인
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API 키가 설정되지 않았습니다. 폴백 추천을 사용합니다.');
      generateFallbackSuggestions();
      setIsLoadingSuggestions(false);
      return;
    }
    
    try {
      // 현재 대화 컨텍스트 준비
      const conversationContext = currentConversation?.messages || [];
      const conversationHistory = conversationContext.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // 시스템 프롬프트 구성
      const systemPrompt = `당신은 한국어 대화 보조 AI입니다. 사용자의 관심사와 현재 대화 맥락을 바탕으로 자연스러운 다음 발언을 추천해주세요.

사용자 관심사: ${user.preferSubject || user.characteristics || '일반적인 대화'}

다음 조건을 만족하는 5개의 짧은 발언을 JSON 형태로 제공해주세요:
1. 현재 대화 맥락에 자연스럽게 이어지는 내용
2. 사용자의 관심사를 반영한 내용
3. 한국어로 작성
4. 각 발언은 15자 이내의 짧은 문장
5. 일상 대화에서 자주 사용하는 표현

응답은 반드시 다음 JSON 형식으로 제공해주세요:
{
  "suggestions": ["발언1", "발언2", "발언3", "발언4", "발언5"]
}`;

      // OpenAI API 메시지 구성
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { 
          role: 'user', 
          content: '위 대화 맥락에 맞는 자연스러운 다음 발언 5개를 JSON 형식으로 추천해주세요.' 
        }
      ];

      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      };

      console.log('OpenAI API 요청:', requestBody);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenAI API 응답:', data);

      // API 응답에서 추천 목록 추출
      if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
          const content = data.choices[0].message.content;
          const parsedResponse = JSON.parse(content);
          
          if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
            setAiSuggestions(parsedResponse.suggestions);
          } else {
            console.warn('OpenAI 응답에 suggestions 배열이 없습니다:', parsedResponse);
            generateFallbackSuggestions();
          }
        } catch (parseError) {
          console.error('OpenAI 응답 파싱 오류:', parseError);
          generateFallbackSuggestions();
        }
      } else {
        console.warn('OpenAI API 응답 형식이 올바르지 않습니다:', data);
        generateFallbackSuggestions();
      }
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error);
      // 에러 발생 시 폴백 추천 사용
      generateFallbackSuggestions();
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 폴백용 기본 추천
  const generateFallbackSuggestions = () => {
    const fallbackSuggestions = [
      '안녕하세요',
      '도움이 필요해요',
      '고마워요',
      '괜찮아요',
      '잠깐만요',
      '알겠어요',
      '죄송해요',
      '더 말해주세요'
    ];
    setAiSuggestions(fallbackSuggestions);
  };

  const handleSpeak = (text: string) => {
    onAddSpeechRecord(text);
    
    if (currentConversation) {
      onAddConversationMessage(text, 'user');
    } else {
      onStartConversation(text);
    }

    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
      
      // TTS 시작 시 콜백 호출 (0.5초 딜레이 후 마이크 녹음 시작)
      onTTSStart();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl">안녕하세요, {user.name}님</h1>
          {currentConversation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              대화 중
            </Badge>
          )}
          {isListening && (
            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
              <Mic className="h-3 w-3" />
              듣는 중
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - History and Suggestions */}
        <div className="w-1/2 flex flex-col border-r overflow-hidden">
          {/* Speech History */}
          <Card className="flex-1 flex flex-col rounded-none border-0 border-b overflow-hidden">
            <CardContent className="flex-1 min-h-0 overflow-hidden p-4">
              <div className="h-full flex flex-col min-h-0">
                <h3 className="text-lg font-medium mb-2 flex-shrink-0">발화 기록</h3>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <SpeechHistoryList
                    speechHistory={speechHistory}
                    onSpeak={handleSpeak}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestion Tabs */}
          <Card className="flex-1 flex flex-col rounded-none border-0 overflow-hidden">
            <CardContent className="flex-1 min-h-0 overflow-hidden p-4">
            <SpeechSuggestionTabs 
              speechHistory={speechHistory}
              aiSuggestions={aiSuggestions}
              isLoadingSuggestions={isLoadingSuggestions}
              onSpeak={handleSpeak}
            />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Conversation and Input */}
        <div className="w-1/2 flex flex-col">
          {/* Conversation Area */}
          <div className="flex-1 overflow-hidden">
            {currentConversation ? (
              <ConversationPanel
                conversation={currentConversation}
                isListening={isListening}
                onAddMessage={onAddConversationMessage}
                onEndConversation={onEndConversation}
                onSetMicRecordingCallback={onSetMicRecordingCallback}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">대화를 시작해보세요</p>
                  <p className="text-sm">말하고 싶은 문장을 선택하거나 직접 입력하세요</p>
                </div>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="border-t p-4">
            <TextToSpeechInput onSpeak={handleSpeak} />
          </div>
        </div>
      </div>
    </div>
  );
}