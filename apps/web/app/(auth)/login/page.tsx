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
    
    let actualEmail = loginEmail;
    if (isAdminLogin) {
      actualEmail = 'admin@landnote.com';
    } else if (!loginEmail.includes('@')) {
      // If no @ is present, assume it's a phone number and strip hyphens/non-digits
      actualEmail = loginEmail.replace(/[^0-9]/g, '') + '@landnote.com';
    }

    const actualPassword = isAdminLogin ? 'admin1234!' : loginPass;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: actualEmail, password: actualPassword }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setError(json.error?.message ?? '로그인에 실패했습니다');
        setLoading(false);
        return;
      }

      const data = json.data ?? json;
      const session = data.session;

      if (session) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      router.push('/dashboard');
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
            <Label htmlFor="email">전화번호 (아이디)</Label>
            <Input
              id="email"
              type="text"
              placeholder="010-0000-0000 (체험은 admin 입력)"
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
