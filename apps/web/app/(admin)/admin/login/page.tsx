'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { formatPhoneNumber } from '@/lib/utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('landnote_admin_saved_id');
    const savedPassword = localStorage.getItem('landnote_admin_saved_password');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberCredentials(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberCredentials) {
      localStorage.setItem('landnote_admin_saved_id', email);
      localStorage.setItem('landnote_admin_saved_password', password);
    } else {
      localStorage.removeItem('landnote_admin_saved_id');
      localStorage.removeItem('landnote_admin_saved_password');
    }

    let actualEmail = email;
    if (!email.includes('@')) {
      actualEmail = email.replace(/[^0-9]/g, '') + '@landnote.com';
    }
    let actualPassword = password;
    if (password === '3304' || (password.length === 4 && /^\d+$/.test(password))) {
      actualPassword = password + password; // 4자리 숫자(3304) 입력 시 8자리(33043304) 자동 연동
    }

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: actualPassword,
      });

      if (signInError) {
        setError(signInError.message || '아이디 또는 비밀번호가 올바르지 않습니다');
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setError(err?.message || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">랜드노트 관리자</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">아이디 (전화번호 또는 이메일)</Label>
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
              <Label htmlFor="password">비밀번호</Label>
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
            
            <div className="flex items-center justify-between mt-2 mb-4">
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
              <Link
                href="/admin/reset-password"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                비밀번호 찾기
              </Link>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
