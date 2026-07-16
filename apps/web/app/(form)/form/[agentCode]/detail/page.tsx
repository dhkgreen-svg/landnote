'use client'; // trigger fast refresh 1 // trigger fast refresh 3

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useFormStore } from '@/lib/stores/form-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormProgress } from '../Step1Client';
import { CATEGORY_LABELS, SUBCATEGORIES, SUBCATEGORY_LABELS } from '@landnote/shared';
import type { CategoryCode } from '@landnote/shared';

const CATEGORY_STYLES: Record<string, {
  bg: string; text: string; lightBg: string;
}> = {
  residential: {
    bg: 'hsl(226, 76%, 56%)',
    text: 'hsl(226, 76%, 44%)',
    lightBg: 'hsl(226, 76%, 97%)',
  },
  commercial: {
    bg: 'hsl(32, 95%, 52%)',
    text: 'hsl(32, 90%, 38%)',
    lightBg: 'hsl(36, 100%, 96%)',
  },
  industrial: {
    bg: 'hsl(190, 50%, 42%)',
    text: 'hsl(190, 50%, 32%)',
    lightBg: 'hsl(190, 40%, 96%)',
  },
  land: {
    bg: 'hsl(152, 55%, 42%)',
    text: 'hsl(152, 55%, 30%)',
    lightBg: 'hsl(152, 45%, 96%)',
  },
};

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentCode = params.agentCode as string;
  const store = useFormStore();

  useEffect(() => {
    if (!store.inquiry_type || store.category_codes.length === 0) {
      router.replace(`/form/${agentCode}`);
    }
  }, [agentCode, store.inquiry_type, store.category_codes, router]);

  const handleNext = () => {
    router.push(`/form/${agentCode}/input`);
  };

  return (
    <>
      <FormProgress current={3} />

      <h2 className="mb-2 text-center text-xl font-bold">세부 조건 선택</h2>
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        관심 있는 세부 유형을 선택해주세요 (복수 선택 가능)
      </p>

      <div className="space-y-4">
        {store.category_codes.map(catCode => {
          const groups = SUBCATEGORIES[catCode as CategoryCode];
          if (!groups) return null;
          const colors = CATEGORY_STYLES[catCode as CategoryCode];

          return (
            <div
              key={catCode}
              className="rounded-xl p-4"
              style={{ backgroundColor: colors?.lightBg ?? 'transparent' }}
            >
              <h3
                className="mb-3 flex items-center gap-2 text-base font-bold"
                style={{ color: colors?.text ?? 'inherit' }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors?.bg ?? 'hsl(220, 91%, 54%)' }}
                />
                {CATEGORY_LABELS[catCode as CategoryCode] ?? catCode}
              </h3>

              {Object.entries(groups).map(([subcatCode, subItems]) => (
                <div key={subcatCode} className="mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                    {SUBCATEGORY_LABELS[subcatCode] ?? subcatCode}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {subItems.map(item => {
                      const isSubcatSelected = store.subcategory_codes.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            store.toggleSubcategory(item);
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                            isSubcatSelected
                              ? 'text-white shadow-sm'
                              : 'text-foreground/70 hover:shadow-sm'
                          }`}
                          style={
                            isSubcatSelected
                              ? { backgroundColor: colors?.bg ?? 'hsl(220, 91%, 54%)' }
                              : { backgroundColor: 'white' }
                          }
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-base"
          onClick={() => router.push(`/form/${agentCode}/category`)}
        >
          이전
        </Button>
        <Button
          type="button"
          className="flex-1 h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white"
          onClick={handleNext}
          disabled={store.subcategory_codes.length === 0}
        >
          다음
        </Button>
      </div>
    </>
  );
}
