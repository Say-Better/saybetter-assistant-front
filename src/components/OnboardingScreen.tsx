import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface OnboardingScreenProps {
  onComplete: (characteristics: string, preferSubject?: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [characteristics, setCharacteristics] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(characteristics, characteristics); // characteristics가 바로 preferSubject
  };

  const quickOptions = [
    '음성 발화가 어려움',
    '일상 대화 도움 필요',
    '응급상황 대응 지원',
    '가족과의 소통',
    '의료진과의 소통',
    '교육 환경에서 활용'
  ];

  const handleQuickSelect = (option: string) => {
    if (characteristics.includes(option)) {
      setCharacteristics(characteristics.replace(option, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, ''));
    } else {
      setCharacteristics(prev => prev ? `${prev}, ${option}` : option);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">환영합니다!</CardTitle>
          <CardDescription className="text-lg">
            더 나은 서비스 제공을 위해 몇 가지 정보를 알려주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="characteristics" className="text-lg">
                사용 목적 및 특징
              </Label>
              <p className="text-sm text-muted-foreground">
                AI가 더 적절한 표현을 추천할 수 있도록 도와주는 정보입니다.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={characteristics.includes(option) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect(option)}
                    className="text-sm h-auto p-3 whitespace-normal"
                  >
                    {option}
                  </Button>
                ))}
              </div>

              <Textarea
                id="characteristics"
                placeholder="예: 음성 발화가 어려워 텍스트로 의사소통을 합니다. 가족과의 일상 대화를 주로 사용할 예정입니다."
                value={characteristics}
                onChange={(e) => setCharacteristics(e.target.value)}
                className="min-h-32 text-base"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => onComplete('', '')}
                className="flex-1 h-12 text-lg"
              >
                건너뛰기
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-lg"
              >
                시작하기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}