import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '매물 접수 AI 비서 - 랜드노트',
  description: '음성으로 간편하게 부동산 매물을 접수하세요.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function BotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-background md:border-x md:shadow-xl overflow-hidden relative">
      {children}
    </div>
  );
}
