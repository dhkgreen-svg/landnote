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
  
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem('landnote_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberEmail) {
      localStorage.setItem('landnote_saved_email', email);
    } else {
      localStorage.removeItem('landnote_saved_email');
    }

    const isAdminLogin = email === 'admin' && password === 'admin';
    const actualEmail = isAdminLogin ? 'admin@landnote.com' : email;
    const actualPassword = isAdminLogin ? 'admin1234!' : password;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: actualEmail, password: actualPassword }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setError(json.error?.message ?? '로그인에 실패했습니다');
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
        
        // Supabase SSR uses cookies, but we can't easily alter cookie expiration purely from client-side setSession.
        // By default Supabase cookies are persistent. 
      }

      router.push('/dashboard');
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
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
                id="rememberEmail" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <Label htmlFor="rememberEmail" className="text-sm font-normal cursor-pointer">
                아이디 저장
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="keepLoggedIn" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
              />
              <Label htmlFor="keepLoggedIn" className="text-sm font-normal cursor-pointer">
                로그인 상태 유지
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
