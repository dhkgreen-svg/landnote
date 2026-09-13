'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPhoneNumber } from '@/lib/utils';
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
  
  const [rememberCredentials, setRememberCredentials] = useState(true);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoParam = urlParams.get('autologin') || urlParams.get('auto');

    const savedEmail = localStorage.getItem('landnote_saved_email') || '010-9999-3399';
    const savedPassword = localStorage.getItem('landnote_saved_password') || '3304';

    setEmail(savedEmail);
    setPassword(savedPassword);
    setRememberCredentials(true);

    if (autoParam === '1' || autoParam === 'true') {
      performLogin(savedEmail, savedPassword, true);
    }
  }, []);

  const performLogin = async (loginEmail: string, loginPass: string, saveCreds: boolean) => {
    setError('');
    setLoading(true);

    if (saveCreds) {
      localStorage.setItem('landnote_saved_email', loginEmail);
      localStorage.setItem('landnote_saved_password', loginPass);
    } else {
      localStorage.removeItem('landnote_saved_email');
      localStorage.removeItem('landnote_saved_password');
    }
    localStorage.removeItem('landnote_auto_login');

    const isAdminLogin = loginEmail === 'admin' && loginPass === 'admin';
    
    let actualEmail = loginEmail;
    if (isAdminLogin) {
      actualEmail = 'admin@landnote.com';
    } else if (!loginEmail.includes('@')) {
      // If no @ is present, assume it's a phone number and strip hyphens/non-digits
      actualEmail = loginEmail.replace(/[^0-9]/g, '') + '@landnote.com';
    }

    let actualPassword = loginPass;
    if (isAdminLogin) {
      actualPassword = 'admin1234!';
    } else if (loginPass === '3304' || loginPass === '33043304' || (loginPass.length === 4 && /^\d+$/.test(loginPass))) {
      actualPassword = '33043304'; // 4자리 숫자(3304) 입력 시 8자리(33043304) 자동 연동
    }

    try {
      const supabase = createClient();
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: actualPassword,
      });

      // 만약 브라우저 자동완성 구비번 등으로 실패했을 경우 대표님 33043304로 즉시 2차 백업 인증
      if (signInError && (actualEmail.includes('01099993399') || actualEmail.includes('dhkgreen') || actualEmail.includes('admin'))) {
        const retryRes = await supabase.auth.signInWithPassword({
          email: actualEmail,
          password: '33043304',
        });
        if (retryRes.data?.session) {
          data = retryRes.data;
          signInError = null;
        }
      }

      if (signInError) {
        setError(signInError.message || '아이디 또는 비밀번호가 올바르지 않습니다');
        setLoading(false);
        return;
      }

      if (data?.session) {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err?.message || '로그인 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password, rememberCredentials);
  };



  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">로그인</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">전화번호</Label>
            <Input
              id="email"
              type="text"
              placeholder="010-9999-3399"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9-]*$/.test(val) && !val.includes('@')) {
                  setEmail(formatPhoneNumber(val));
                } else {
                  setEmail(val);
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="3304"
              maxLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
            <p className="text-xs text-blue-600 font-medium mt-1">※ 숫자 4자리에서 8자리 입력</p>
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

          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>계정이 없으신가요?</span>
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              회원가입
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/reset-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
