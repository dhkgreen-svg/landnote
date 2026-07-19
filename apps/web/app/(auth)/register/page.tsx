'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterStore } from '@/lib/stores/register-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StepIndicator } from './step-indicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();
  const store = useRegisterStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: store.email,
          password: store.password,
          agent_name: store.agent_name,
          phone: store.phone,
          license_number: store.license_number || ('TEMP_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()),
          office_name: store.office_name || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setError(json.error?.message ?? '회원가입에 실패했습니다');
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

      router.push('/register/plan');
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <StepIndicator current={1} />

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">회원가입</CardTitle>
          <CardDescription>기본 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent_name">이름 *</Label>
              <Input
                id="agent_name"
                type="text"
                placeholder="홍길동"
                value={store.agent_name}
                onChange={(e) => store.setField('agent_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={store.email}
                onChange={(e) => store.setField('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                비밀번호 * <span className="text-xs font-normal text-muted-foreground ml-1">(6~8자리 숫자만 가능)</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="6~8자리 숫자를 입력하세요"
                value={store.password}
                onChange={(e) => store.setField('password', e.target.value)}
                required
                minLength={6}
                maxLength={8}
                pattern="\d{6,8}"
                title="6자리에서 8자리 사이의 숫자만 입력 가능합니다."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={store.phone}
                onChange={(e) => store.setField('phone', e.target.value)}
                required
              />
            </div>



            <div className="space-y-2">
              <Label htmlFor="office_name">사무소명 (선택)</Label>
              <Input
                id="office_name"
                type="text"
                placeholder="사무소명"
                value={store.office_name}
                onChange={(e) => store.setField('office_name', e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '처리 중...' : '다음'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
