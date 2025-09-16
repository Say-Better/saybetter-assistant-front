import React, { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { SpeechRecord } from '../App';
import { Volume2, Heart, Search } from 'lucide-react';
import { Input } from './ui/input';

interface SpeechHistoryListProps {
  speechHistory: SpeechRecord[];
  onSpeak: (text: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function SpeechHistoryList({ speechHistory, onSpeak, onToggleFavorite }: SpeechHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = speechHistory.filter(record =>
    record.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Search */}
      <div className="relative mb-1 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="발화 기록 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* History List */}
      <ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="space-y-2 pb-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '검색 결과가 없습니다' : '아직 발화 기록이 없습니다'}
            </div>
          ) : (
            filteredHistory.map((record) => (
              <div
                key={record.id}
                className="group p-3 rounded-lg border hover:bg-accent transition-colors"
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
                      onClick={() => onToggleFavorite(record.id)}
                      className={`h-8 w-8 p-0 ${record.isFavorite ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`h-4 w-4 ${record.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSpeak(record.text)}
                      className="h-8 w-8 p-0"
                    >
                      <Volume2 className="h-4 w-4" />
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