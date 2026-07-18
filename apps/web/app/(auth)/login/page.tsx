'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('landnote_saved_email');
    const savedPassword = localStorage.getItem('landnote_saved_password');
    const isAutoLogin = localStorage.getItem('landnote_auto_login') === 'true';

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberCredentials(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
    if (isAutoLogin) {
      setAutoLogin(true);
    }

    if (isAutoLogin && savedEmail && savedPassword) {
      performLogin(savedEmail, savedPassword, true, true);
    }
  }, []);

  const performLogin = async (loginEmail: string, loginPass: string, saveCreds: boolean, isAuto: boolean) => {
    setError('');
    setLoading(true);

    if (saveCreds) {
      localStorage.setItem('landnote_saved_email', loginEmail);
      localStorage.setItem('landnote_saved_password', loginPass);
    } else {
      localStorage.removeItem('landnote_saved_email');
      localStorage.removeItem('landnote_saved_password');
    }

    if (isAuto) {
      localStorage.setItem('landnote_auto_login', 'true');
    } else {
      localStorage.removeItem('landnote_auto_login');
    }

    const isAdminLogin = loginEmail === 'admin' && loginPass === 'admin';
    const actualEmail = isAdminLogin ? 'admin@landnote.com' : loginEmail;
    const actualPassword = isAdminLogin ? 'admin1234!' : loginPass;

    try {
      if (isAdminLogin) {
        // 백엔드 없이 프론트엔드 단독 테스트 시 admin 모의 로그인을 바로 통과시킵니다.
        router.push('/dashboard');
        return;
      }

      // 일반 로그인은 먼저 Supabase 직접 로그인을 시도합니다.
      const supabase = createClient();
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: actualPassword,
      });

      if (sbError) {
        // 백엔드 의존성을 없애기 위해 Supabase 에러를 바로 표시합니다.
        const errorMsg = sbError.message === 'Invalid login credentials' 
          ? '아이디 또는 비밀번호가 잘못되었습니다.' 
          : sbError.message;
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
        return;
      }

      setError('로그인 응답에 세션이 없습니다.');
      setLoading(false);
    } catch {
      setError('네트워크 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password, rememberCredentials, autoLogin);
  };



  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">로그인</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 또는 아이디</Label>
            <Input
              id="email"
              type="text"
              placeholder="example@email.com (체험은 admin 입력)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="rememberCredentials" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                checked={rememberCredentials}
                onChange={(e) => setRememberCredentials(e.target.checked)}
              />
              <Label htmlFor="rememberCredentials" className="text-sm font-normal cursor-pointer">
                아이디/비밀번호 저장
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="autoLogin" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                checked={autoLogin}
                onChange={(e) => {
                  setAutoLogin(e.target.checked);
                  if (e.target.checked) setRememberCredentials(true);
                }}
              />
              <Label htmlFor="autoLogin" className="text-sm font-normal cursor-pointer">
                자동 로그인
              </Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
