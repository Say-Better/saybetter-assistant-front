import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Volume2, Send } from 'lucide-react';

interface TextToSpeechInputProps {
  onSpeak: (text: string) => void;
}

export function TextToSpeechInput({ onSpeak }: TextToSpeechInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSpeak(text.trim());
      setText('');
    }
  };

  const quickPhrases = [
    '네', '아니요', '잠깐만요', '도와주세요', '고마워요', '죄송해요'
  ];

  return (
    <div className="space-y-4">
      {/* Quick Phrases */}
      <div className="grid grid-cols-3 gap-2">
        {quickPhrases.map((phrase) => (
          <Button
            key={phrase}
            variant="outline"
            size="sm"
            onClick={() => onSpeak(phrase)}
            className="text-sm h-10"
          >
            {phrase}
          </Button>
        ))}
      </div>

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="말하고 싶은 내용을 입력하세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-20 text-base resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setText('')}
            disabled={!text.trim()}
            className="flex-1"
          >
            지우기
          </Button>
          <Button
            type="submit"
            disabled={!text.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            발화하기
          </Button>
        </div>
      </form>
    </div>
  );
}