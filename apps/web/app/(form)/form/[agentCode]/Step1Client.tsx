'use client';

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
}

export function FormProgress({ current }: { current: number }) {
  // return null to hide progress bar as requested by user
  return null;
}



export default function Step1Client({ agentCode, agentName, officeName, phone, selectedCategories, subscriptionPlan }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useFormStore();

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
      if (!store.category_codes.includes(catParam)) {
        store.toggleCategory(catParam, maxSelectable);
      }
      router.push(`/form/${agentCode}/detail`);
    } else if (isSingleCategory) {
      if (!store.category_codes.includes(safeCats[0])) {
        store.toggleCategory(safeCats[0], maxSelectable);
      }
      router.push(`/form/${agentCode}/detail`);
    } else {
      router.push(`/form/${agentCode}/category`);
    }
  };

  return (
    <>
      <FormProgress current={1} />

      <div className="mb-10 text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {agentName}{agentName.endsWith('중개사') ? '' : ' 중개사'}
        </h2>
        {phone && /^[0-9+()\-\s]{8,20}$/.test(phone) && (
          <a href={`tel:${phone}`} className="inline-block px-4 py-1.5 rounded-full bg-muted/50 text-base font-medium text-foreground hover:bg-muted transition-colors">
            {phone}
          </a>
        )}
      </div>

      <div className="space-y-4 mt-8">
        <Card
          className="cursor-pointer border-transparent bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => handleSelect('looking_for')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-sm">
              🔍
            </div>
            <div>
              <p className="text-lg font-bold">원하는 매물을 찾고 있어요</p>
              <p className="mt-1 text-sm text-primary-foreground/80 font-medium">
                조건을 남기면 맞는 매물을 찾아드립니다
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-transparent bg-indigo-600 text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => handleSelect('listing')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-sm">
              🏠
            </div>
            <div>
              <p className="text-lg font-bold">매물을 접수하고 싶어요</p>
              <p className="mt-1 text-sm text-indigo-100 font-medium">
                가지고 계신 매물을 빠르게 거래해 드립니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </>
  );
}
