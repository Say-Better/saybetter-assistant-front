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
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(0); // 0: 남성, 1: 여성
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력 검증
    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    
    if (isSignup && (!name.trim() || !age.trim())) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (isSignup) {
        // 회원가입 API 호출
        const requestBody = {
          memberId: userId.trim(),
          password: password.trim(),
          name: name.trim(),
          age: age.trim(),
          gender: gender,
          preferSubject: "", // 온보딩에서 설정할 예정
        };
        
        console.log('회원가입 요청:', requestBody);
        
        const response = await fetch('/api/member/sign-up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('회원가입 응답 상태:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log('회원가입 에러 응답:', errorData);
          throw new Error(errorData.message || `회원가입에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        console.log('회원가입 성공:', data);
        
        // 회원가입 성공 시 사용자 정보 생성
        const userData: User = {
          id: data.user?.id || data.id || data.memberId || name.trim(),
          memberNum: parseInt(data.user?.memberNum || data.memberNum || data.id, 10) || 0,
          name: data.user?.name || data.name || data.memberName || name.trim(),
          characteristics: data.user?.characteristics || data.characteristics || '',
          preferSubject: preferSubject.trim(),
          createdAt: new Date(data.user?.createdAt || data.createdAt || Date.now())
        };
        
        onSignup(userData);
      } else {
        // 로그인 API 호출
        const requestBody = {
          memberId: userId.trim(),
          password: password.trim(),
        };
        
        console.log('로그인 요청:', requestBody);
        
        const response = await fetch('/api/member/sign-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('응답 상태:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log('에러 응답:', errorData);
          throw new Error(errorData.message || `로그인에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        console.log('로그인 성공:', data);
        
        // API 응답에서 사용자 정보 추출
        const userData: User = {
          id: data.user?.id || data.id || data.memberId || userId,
          memberNum: parseInt(data.user?.memberNum || data.memberNum || data.id, 10) || 0,
          name: data.user?.name || data.name || data.memberName || userId,
          characteristics: data.user?.characteristics || data.characteristics || '',
          preferSubject: data.user?.preferSubject || data.preferSubject || '',
          createdAt: new Date(data.user?.createdAt || data.createdAt || Date.now())
        };

        onLogin(userData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="userId">아이디</Label>
              <Input
                id="userId"
                type="text"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            
            {isSignup && (
              <>
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
                
                <div className="space-y-2">
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="나이를 입력하세요"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>성별</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gender"
                        value={0}
                        checked={gender === 0}
                        onChange={() => setGender(0)}
                        className="w-4 h-4"
                      />
                      <span>남성</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gender"
                        value={1}
                        checked={gender === 1}
                        onChange={() => setGender(1)}
                        className="w-4 h-4"
                      />
                      <span>여성</span>
                    </label>
                  </div>
                </div>
                
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading || !userId.trim() || !password.trim() || (isSignup && (!name.trim() || !age.trim()))}
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