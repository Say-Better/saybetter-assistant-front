import React from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { SpeechRecord } from '../App';
import { Heart } from 'lucide-react';

interface SpeechHistoryListProps {
  speechHistory: SpeechRecord[];
  onSpeak: (text: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function SpeechHistoryList({ speechHistory, onSpeak, onToggleFavorite }: SpeechHistoryListProps) {

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col">
      {/* History List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pb-2 pr-3">
          {speechHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 발화 기록이 없습니다
            </div>
          ) : (
            speechHistory.map((record) => (
              <div
                key={record.id}
                className="group p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                onClick={() => onSpeak(record.text)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words">{record.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(record.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onToggleFavorite(record.id);
                      }}
                      className={`h-8 w-8 p-0 ${record.isFavorite ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`h-4 w-4 ${record.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}