'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, MessageSquare, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InvitePage() {
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    setInviteUrl(`${window.location.origin}/register`);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('가입 링크가 복사되었습니다.');
  };

  const handleShareKakao = () => {
    if (!(window as any).Kakao) {
      alert('카카오톡 공유 기능을 불러오지 못했습니다.');
      return;
    }

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) return;

    if (!(window as any).Kakao.isInitialized()) {
      (window as any).Kakao.init(kakaoKey);
    }

    (window as any).Kakao.Share.sendDefault({
      objectType: 'text',
      text: '랜드노트 공인중개사 전용 시스템에 가입하세요! 아래 링크를 통해 바로 가입하실 수 있습니다.',
      link: {
        mobileWebUrl: inviteUrl,
        webUrl: inviteUrl,
      },
      buttonTitle: '가입하기',
    });
  };

  const handleShareSMS = () => {
    const text = '랜드노트 공인중개사 전용 시스템에 가입하세요!\n\n가입 링크:\n' + inviteUrl;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">가입 초대 링크</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>공인중개사 초대하기</CardTitle>
          <CardDescription>
            새로운 공인중개사에게 이 링크를 보내면 백지 상태에서 새로 회원가입을 진행할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input value={inviteUrl} readOnly className="bg-white text-black" />
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              복사
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90" onClick={handleShareKakao}>
              <MessageCircle className="h-4 w-4 mr-2" />
              카카오톡으로 초대장 보내기
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleShareSMS}>
              <MessageSquare className="h-4 w-4 mr-2" />
              문자로 초대장 보내기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
