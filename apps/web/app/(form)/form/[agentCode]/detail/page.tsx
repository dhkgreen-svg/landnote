'use client'; // trigger fast refresh 10

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormStore } from '@/lib/stores/form-store';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (subcatCode: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [subcatCode]: !prev[subcatCode]
    }));
  };

  useEffect(() => {
    if (!store.inquiry_type || (store.category_codes || []).length === 0) {
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
        관심 있는 세부 유형을 1개만 선택해주세요
      </p>

      <div className="space-y-4">
        {(store.category_codes || []).map(catCode => {
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

              {Object.entries(groups).map(([subcatCode, subItems]) => {
                const isExpanded = !!expandedGroups[subcatCode];
                const hasSelectedItems = subItems.some(item => (store.tags || []).includes(item));
                
                return (
                  <div key={subcatCode} className="mb-4 bg-white rounded-lg border shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => toggleGroup(subcatCode)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground/90">
                          {SUBCATEGORY_LABELS[subcatCode] ?? subcatCode}
                        </span>
                        {hasSelectedItems && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {subItems.filter(item => (store.tags || []).includes(item)).length}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground transition-transform duration-200">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t bg-muted/10">
                        <div className="flex flex-wrap gap-2 mt-4">
                          {subItems.map(item => {
                            const isSubcatSelected = (store.tags || []).includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  store.setStoreValue('subcategory_codes', [subcatCode]);
                                  store.setStoreValue('tags', [item]);
                                  setTimeout(() => {
                                    handleNext();
                                  }, 150);
                                }}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                                  isSubcatSelected
                                    ? 'text-white shadow-sm ring-2 ring-primary ring-offset-1'
                                    : 'text-foreground/70 hover:shadow-sm hover:bg-white border bg-white'
                                }`}
                                style={
                                  isSubcatSelected
                                    ? { backgroundColor: colors?.bg ?? 'hsl(220, 91%, 54%)' }
                                    : {}
                                }
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base"
          onClick={() => router.push(`/form/${agentCode}/category`)}
        >
          이전으로 돌아가기
        </Button>
      </div>
    </>
  );
}
