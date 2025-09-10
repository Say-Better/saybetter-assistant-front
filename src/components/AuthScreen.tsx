import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User } from '../App';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const userData: User = {
      id: Date.now().toString(),
      name: name.trim(),
      characteristics: '',
      createdAt: new Date()
    };

    if (isSignup) {
      onSignup(userData);
    } else {
      onLogin(userData);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">발화 도우미</CardTitle>
          <CardDescription>
            {isSignup ? '새 계정을 만들어 시작하세요' : '계속하려면 로그인하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading || !name.trim()}
            >
              {loading ? '처리 중...' : (isSignup ? '가입하기' : '로그인')}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm"
              >
                {isSignup ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 가입하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}