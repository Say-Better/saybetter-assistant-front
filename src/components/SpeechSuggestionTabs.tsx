import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { SpeechRecord } from '../App';
import { Heart, Sparkles, Volume2 } from 'lucide-react';

interface SpeechSuggestionTabsProps {
  speechHistory: SpeechRecord[];
  aiSuggestions: string[];
  onSpeak: (text: string) => void;
}

export function SpeechSuggestionTabs({ speechHistory, aiSuggestions, onSpeak }: SpeechSuggestionTabsProps) {
  const favoriteRecords = speechHistory.filter(record => record.isFavorite);

  return (
    <Tabs defaultValue="favorites" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
        <TabsTrigger value="favorites" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          즐겨찾기
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI 추천
        </TabsTrigger>
      </TabsList>

      <TabsContent value="favorites" className="flex-1 mt-4 mx-4">
        <ScrollArea className="h-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <div className="space-y-2 pb-4">
            {favoriteRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>즐겨찾기한 문장이 없습니다</p>
                <p className="text-sm mt-1">발화 기록에서 ♥를 눌러 추가해보세요</p>
              </div>
            ) : (
              favoriteRecords.map((record) => (
                <Button
                  key={record.id}
                  variant="outline"
                  className="w-full h-auto p-4 text-left justify-start whitespace-normal"
                  onClick={() => onSpeak(record.text)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Volume2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{record.text}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="ai" className="flex-1 mt-4 mx-4">
        <ScrollArea className="h-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
          <div className="space-y-2 pb-24 pr-3">
            {aiSuggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>AI 추천을 생성하는 중...</p>
              </div>
            ) : (
              aiSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full h-auto p-4 text-left justify-start whitespace-normal hover:bg-blue-50"
                  onClick={() => onSpeak(suggestion)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span className="break-words">{suggestion}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}