import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, SpeechRecord, Conversation } from '../App';
import { SpeechHistoryList } from './SpeechHistoryList';
import { SpeechSuggestionTabs } from './SpeechSuggestionTabs';
import { TextToSpeechInput } from './TextToSpeechInput';
import { ConversationPanel } from './ConversationPanel';
import { Menu, Settings, MessageSquare, Mic, MicOff } from 'lucide-react';

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
  onOpenSidebar
}: HomeScreenProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Generate AI suggestions based on conversation context
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
      if (lastMessage.type === 'response') {
        // Generate contextual suggestions based on the response
        generateContextualSuggestions(lastMessage.text);
      }
    } else {
      // Generate general suggestions based on user characteristics
      generateGeneralSuggestions();
    }
  }, [currentConversation, user.characteristics]);

  const generateContextualSuggestions = (responseText: string) => {
    // Simple contextual suggestions - in real app, this would use AI
    const suggestions: string[] = [];
    
    if (responseText.includes('안녕')) {
      suggestions.push('안녕하세요', '반가워요', '오늘 기분 어때요?');
    } else if (responseText.includes('어때') || responseText.includes('어떠')) {
      suggestions.push('좋아요', '괜찮아요', '그저 그래요', '더 자세히 말해줄 수 있어요?');
    } else if (responseText.includes('뭐') || responseText.includes('무엇')) {
      suggestions.push('글쎄요', '잘 모르겠어요', '생각해볼게요', '다른 걸로 해요');
    } else {
      suggestions.push('네, 맞아요', '아니에요', '더 말해주세요', '고마워요');
    }
    
    setAiSuggestions(suggestions);
  };

  const generateGeneralSuggestions = () => {
    const general = [
      '안녕하세요',
      '도움이 필요해요',
      '고마워요',
      '괜찮아요',
      '잠깐만요',
      '알겠어요',
      '죄송해요',
      '화장실 가고 싶어요'
    ];
    setAiSuggestions(general);
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