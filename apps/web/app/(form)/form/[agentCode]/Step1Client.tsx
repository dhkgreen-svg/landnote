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

function FormProgress({ current }: { current: number }) {
  const steps = ['유형 선택', '카테고리', '세부 조건', '정보 입력'];
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? '\u2713' : step}
              </div>
              <span
                className={`mt-1.5 text-[11px] ${
                  isActive ? 'font-medium text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-8 rounded-full ${
                  isCompleted ? 'bg-primary/40' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { FormProgress };

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

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">{agentName} 중개사</h2>
        {officeName && (
          <p className="mt-1 text-sm text-muted-foreground">{officeName}</p>
        )}
        {phone && /^[0-9+()\-\s]{8,20}$/.test(phone) && (
          <a href={`tel:${phone}`} className="text-sm text-muted-foreground underline">
            {phone}
          </a>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          입력하신 정보는 해당 중개사에게만 전달됩니다
        </p>
      </div>

      <p className="mb-5 text-center text-base font-medium text-foreground/80">
        어떤 도움이 필요하신가요?
      </p>

      <div className="space-y-4">
        <Card
          className="cursor-pointer border-transparent bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20"
          onClick={() => handleSelect('looking_for')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              🔍
            </div>
            <div>
              <p className="text-base font-semibold">원하는 매물을 찾고 있어요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                조건을 남기면 맞는 매물을 찾아드립니다
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-transparent bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20"
          onClick={() => handleSelect('listing')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              🏠
            </div>
            <div>
              <p className="text-base font-semibold">매물을 접수하고 싶어요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                매물 정보를 남기면 바로 검토할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </>
  );
}
