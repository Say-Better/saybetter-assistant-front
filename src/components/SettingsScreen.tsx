import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { User } from '../App';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SettingsScreenProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

export function SettingsScreen({ user, onUpdateUser, onBack }: SettingsScreenProps) {
  const [name, setName] = useState(user.name);
  const [characteristics, setCharacteristics] = useState(user.characteristics);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      characteristics: characteristics.trim()
    };

    onUpdateUser(updatedUser);
    toast.success('설정이 저장되었습니다');
    setLoading(false);
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
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-xl">설정</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              사용자 정보
            </CardTitle>
            <CardDescription>
              개인 정보와 앱 사용 목적을 수정할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-lg h-12 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none"
                />
              </div>

              {/* Characteristics */}
              <div className="space-y-3">
                <Label htmlFor="characteristics">사용 목적 및 특징</Label>
                <p className="text-sm text-muted-foreground">
                  AI가 더 적절한 표현을 추천할 수 있도록 도와주는 정보입니다.
                </p>
                
                {/* Quick Options */}
                <div className="grid grid-cols-2 gap-2">
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
                  className="min-h-32 text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none"
                />
              </div>

              {/* Account Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">계정 정보</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>계정 ID: {user.id}</p>
                  <p>가입일: {new Intl.DateTimeFormat('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }).format(user.createdAt)}</p>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  '저장 중...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장하기
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>앱 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>발화 도우미</strong> v1.0.0</p>
              <p>무발화 뇌병변장애인을 위한 TTS 보조 앱</p>
              <p>음성 합성 기술을 통해 원활한 의사소통을 지원합니다.</p>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">지원되는 기능</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 텍스트 음성 변환 (TTS)</li>
                <li>• 음성 인식 (STT)</li>
                <li>• AI 기반 발화 추천</li>
                <li>• 발화 기록 및 즐겨찾기</li>
                <li>• 대화 기록 저장</li>
              </ul>
            </div>
          </CardContent>
        </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}