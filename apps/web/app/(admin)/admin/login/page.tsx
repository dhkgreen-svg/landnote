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

    try {
      const result = await apiFetch<{ admin: any; session: any }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.session) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다');
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
              <Label htmlFor="email">아이디 (이메일 또는 전화번호)</Label>
              <Input
                id="email"
                type="text"
                placeholder="010-0000-0000 또는 admin@landnote.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
