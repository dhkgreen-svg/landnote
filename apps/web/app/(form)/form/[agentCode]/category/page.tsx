'use client'; // trigger fast refresh 6

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormStore } from '@/lib/stores/form-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormProgress } from '../Step1Client';
import { type CategoryCode } from '@landnote/shared';

const CATEGORY_LABELS: Record<CategoryCode, { label: string; icon: string; desc: string }> = {
  residential: { label: '주거용 부동산', icon: '🏠', desc: '아파트·빌라/다세대·원/투룸·주택/다가구' },
  commercial: { label: '상업용 부동산', icon: '🏬', desc: '상가·사무실·빌딩·가게양도' },
  industrial: { label: '산업용 부동산', icon: '🏭', desc: '공장·창고·물류센터·지식산업센터' },
  land: { label: '토지 및 기타', icon: '🌳', desc: '대지·농지·임야·특수목적부동산' },
};

const CATEGORY_STYLES: Record<CategoryCode, {
  bg: string; border: string; ring: string;
}> = {
  residential: { bg: 'hsl(226, 76%, 97%)', border: 'hsl(226, 60%, 88%)', ring: 'hsl(226, 76%, 56%)' },
  commercial:  { bg: 'hsl(36, 100%, 96%)', border: 'hsl(36, 80%, 85%)',  ring: 'hsl(32, 95%, 52%)' },
  industrial:  { bg: 'hsl(190, 40%, 96%)', border: 'hsl(190, 35%, 85%)', ring: 'hsl(190, 50%, 42%)' },
  land:        { bg: 'hsl(152, 45%, 96%)', border: 'hsl(152, 40%, 85%)', ring: 'hsl(152, 55%, 42%)' },
};

const ALL_CATEGORIES: CategoryCode[] = ['residential', 'commercial', 'industrial', 'land'];

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const agentCode = params.agentCode as string;
  const store = useFormStore();
  const [agentCategories, setAgentCategories] = useState<CategoryCode[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('starter');

  useEffect(() => {
    if (!store.inquiry_type) {
      router.replace(`/form/${agentCode}`);
      return;
    }
    const stored = sessionStorage.getItem(`landnote_agent_${agentCode}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const cats: CategoryCode[] = parsed.selectedCategories ?? [];
      const plan = parsed.subscriptionPlan ?? 'starter';
      setAgentCategories(cats);
      setSubscriptionPlan(plan);

      // 활성 카테고리가 1개뿐이면 자동 선택 후 detail로 스킵
      if (cats.length === 1 && store.category_codes.length === 0) {
        store.toggleCategory(cats[0], plan === 'pro' ? 4 : 1);
        router.replace(`/form/${agentCode}/detail`);
        return;
      }
    }
  }, [agentCode, store.inquiry_type, router]);

  const handleNext = () => {
    if (store.category_codes.length === 0) return;
    router.push(`/form/${agentCode}/detail`);
  };

  const safeAgentCategories = Array.isArray(agentCategories) ? agentCategories.filter(Boolean) : [];
  const maxSelectable = 1;

  console.log('CategoryPage render:', { agentCategories, safeAgentCategories, subscriptionPlan, maxSelectable });

  return (
    <>
      <FormProgress current={2} />

      <div className="grid grid-cols-2 gap-4 mt-8">
        {ALL_CATEGORIES.map(code => {
          const meta = CATEGORY_LABELS[code];
          const colors = CATEGORY_STYLES[code];
          
          let isSelectable = false;
          if (subscriptionPlan === 'pro' || safeAgentCategories.length === 0) {
            isSelectable = true;
          } else {
            isSelectable = safeAgentCategories.includes(code);
          }

          const isSelected = store.category_codes.includes(code);

          console.log(`Category ${code} isSelectable:`, isSelectable);

          if (!isSelectable) return null;

          return (
            <Card
              key={code}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 shadow-md'
                  : 'border-transparent shadow-sm hover:shadow-md'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      '--tw-ring-color': colors.ring,
                    } as React.CSSProperties
                  : { backgroundColor: colors.bg }
              }
              onClick={() => {
                store.setStoreValue('category_codes', [code]);
                setTimeout(() => {
                  router.push(`/form/${agentCode}/detail`);
                }, 100);
              }}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <span className="text-4xl">{meta.icon}</span>
                <span className="text-sm font-bold">{meta.label}</span>
                <span className="text-xs text-muted-foreground leading-relaxed hidden">{meta.desc}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-base"
          onClick={() => router.push(`/form/${agentCode}`)}
        >
          이전
        </Button>
      </div>
    </>
  );
}
