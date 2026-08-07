'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStore } from '@/lib/stores/form-store';
import { Card, CardContent } from '@/components/ui/card';
import type { CategoryCode } from '@landnote/shared';

interface Props {
  agentCode: string;
  agentName: string;
  officeName: string | null;
  phone: string | null;
  selectedCategories: CategoryCode[];
  subscriptionPlan: string;
  isBetaTester?: boolean;
}

export function FormProgress({ current }: { current: number }) {
  // return null to hide progress bar as requested by user
  return null;
}

export default function Step1Client({ agentCode, agentName, officeName, phone, selectedCategories, subscriptionPlan, isBetaTester }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useFormStore();
  const [showMethodModal, setShowMethodModal] = useState(false);

  const handleSelect = (type: 'looking_for' | 'listing') => {
    store.setInquiryType(type);
    // selectedCategories를 세션스토리지에 저장 (다음 스텝에서 사용)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `landnote_agent_${agentCode}`,
        JSON.stringify({ agentName, officeName, phone, selectedCategories, subscriptionPlan }),
      );
    }

    const catParam = searchParams.get('cat') as CategoryCode | null;
    const safeCats = Array.isArray(selectedCategories) ? selectedCategories.filter(Boolean) : [];
    const maxSelectable = 1;
    const isValidCat = catParam && (subscriptionPlan === 'pro' || safeCats.includes(catParam));
    const isSingleCategory = safeCats.length === 1;

    if (isValidCat) {
      if (!(store.category_codes || []).includes(catParam)) {
        store.toggleCategory(catParam, maxSelectable);
      }
      router.push(`/form/${agentCode}/detail`);
    } else if (isSingleCategory) {
      if (!(store.category_codes || []).includes(safeCats[0])) {
        store.toggleCategory(safeCats[0], maxSelectable);
      }
      router.push(`/form/${agentCode}/detail`);
    } else {
      router.push(`/form/${agentCode}/category`);
    }
  };

  const handleListingClick = () => {
    if (isBetaTester) {
      setShowMethodModal(true);
    } else {
      handleSelect('listing');
    }
  };

  return (
    <>
      <FormProgress current={1} />

      <div className="mb-10 text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {officeName || `${agentName}${agentName.endsWith('중개사') ? '' : ' 중개사'}`}
        </h2>
        {phone && /^[0-9+()\-\s]{8,20}$/.test(phone) && (
          <a href={`tel:${phone}`} className="inline-block px-4 py-1.5 rounded-full bg-muted/50 text-base font-medium text-foreground hover:bg-muted transition-colors">
            {phone}
          </a>
        )}
      </div>

      <div className="space-y-4 mt-8">
        <Card
          className="cursor-pointer border-transparent bg-indigo-600 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleListingClick}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-sm">
              🏠
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">매물 접수</p>
              <p className="mt-1 text-sm text-indigo-100 font-medium">
                가지고 계신 매물을 빠르게 거래해 드립니다
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-transparent bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => handleSelect('looking_for')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-sm">
              🔍
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">매수 / 임대</p>
              <p className="mt-1 text-sm text-primary-foreground/80 font-medium">
                조건을 남기면 맞는 매물을 찾아드립니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showMethodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">접수 방식 선택</h3>
              <p className="text-xs text-zinc-500 mt-1">편리한 방법으로 매물을 접수해 주세요</p>
            </div>
            <div className="space-y-3">
              <div
                className="cursor-pointer relative overflow-hidden rounded-2xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/50 to-white p-4 transition-all hover:shadow-md hover:scale-[1.01] active:scale-95"
                onClick={() => router.push(`/bot/${agentCode}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-xl">
                    🎙️
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">AI 음성 챗봇으로 접수</p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">말 한마디로 30초 만에 접수 완료 (추천)</p>
                  </div>
                </div>
              </div>

              <div
                className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:bg-zinc-50 hover:scale-[1.01] active:scale-95"
                onClick={() => {
                  setShowMethodModal(false);
                  handleSelect('listing');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 text-xl">
                    📝
                  </div>
                  <div>
                    <p className="font-bold text-zinc-800 text-sm">일반 텍스트 입력</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">기존 입력 폼을 채워서 접수</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-center">
              <button
                onClick={() => setShowMethodModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors py-1 px-4"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
