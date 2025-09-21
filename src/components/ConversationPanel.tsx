import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Conversation } from '../App';
import { Mic, MicOff, PhoneOff, User, MessageSquare } from 'lucide-react';

// Speech Recognition 타입 정의
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: () => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface ConversationPanelProps {
  conversation: Conversation;
  isListening: boolean;
  onAddMessage: (text: string, type: 'user' | 'response') => void;
  onEndConversation: () => void;
  onSetMicRecordingCallback: (callback: () => void) => void;
}

export function ConversationPanel({ 
  conversation, 
  isListening, 
  onAddMessage, 
  onEndConversation,
  onSetMicRecordingCallback
}: ConversationPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isRecordingRef = useRef(isRecording);
  const isListeningRef = useRef(isListening);

  // Update ref when isRecording changes
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Update ref when isListening changes
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);


  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onAddMessage(transcript, 'response');
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, [onAddMessage]);

  // 마이크 녹음 시작 함수를 상위 컴포넌트에 등록
  useEffect(() => {
    // recognition이 있으면 항상 콜백 등록 (isListening 상관없이)
    if (recognition) {
      onSetMicRecordingCallback(() => {
        // 항상 마이크 녹음 시작 시도 (첫 번째 발화 포함)
        try {
          if (isRecordingRef.current) {
            recognition.stop();
          }
          setTimeout(() => {
            // 콜백 실행 시점에 다시 한 번 대화 중인지 확인
            if (isListeningRef.current) {
              setIsRecording(true);
              recognition.start();
            }
          }, 100);
        } catch (error) {
          console.error('마이크 녹음 시작 오류:', error);
        }
      });
    }
  }, [recognition]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [conversation.messages]);

  const startListening = () => {
    if (recognition && !isRecording) {
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="h-full rounded-none border-0 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{conversation.title}</CardTitle>
            {isListening && (
              <Badge variant="secondary" className="text-xs">
                대화 중
              </Badge>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndConversation}
            className="h-8"
          >
            <PhoneOff className="h-4 w-4 mr-1" />
            종료
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 min-h-0 no-scrollbar" 
          ref={scrollAreaRef}
          style={{ 
            maxHeight: 'calc(100vh - 200px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'response' && (
                      <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="break-words">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Recording Controls */}
        {isListening && (
          <div className="border-t p-4">
            <div className="flex items-center justify-center gap-4">
              <p className="text-sm text-muted-foreground">
                상대방의 응답을 기다리는 중...
              </p>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? stopListening : startListening}
                disabled={!recognition}
                className="rounded-full h-12 w-12 p-0"
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              {isRecording && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-500">녹음 중</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}