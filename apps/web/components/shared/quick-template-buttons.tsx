import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Settings2, Mic, MicOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgent } from '@/lib/hooks/use-agent';
import { useUpdateAgentTemplates } from '@/lib/hooks/queries';
import { useSpeechRecognition } from '@/lib/hooks/use-speech-recognition';

export const QUICK_TEMPLATES: Record<string, string[]> = {
  residential: [
    '매매가 (만원) = ', '보증금 (만원) = ', '월세 (만원) = ',
    '공급면적 (㎡) = ', '전용면적 (㎡) = ',
    '방 (개) = ', '화장실 (개) = ', '해당층/총층 = ',
    '정남향', '올수리됨', '즉시입주 가능', '주차 1대 무료'
  ],
  commercial: [
    '보증금 (만원) = ', '월세 (만원) = ', '권리금 (만원) = ',
    '전용면적 (㎡) = ', '현재업종 = ', '추천업종 = ',
    '엘리베이터 있음', '무료주차 1대', '내부 화장실', '수도/도시가스 인입'
  ],
  industrial: [
    '매매가 (만원) = ', '보증금 (만원) = ', '월세 (만원) = ',
    '대지면적 (㎡) = ', '연면적 (㎡) = ',
    '층고 (m) = ', '동력 (kw) = ', '호이스트 (톤) = ',
    '대형 트레일러 진입가능', '단독 마당 사용'
  ],
  land: [
    '매매가 (만원) = ', '대지면적 (㎡) = ', '용도지역 = ', '지목 = ', 
    '도로접함 = ', '건축허가 = '
  ]
};

export const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거용',
  commercial: '상업용',
  industrial: '산업용',
  land: '토지/기타'
};

interface QuickTemplateButtonsProps {
  onSelect: (text: string) => void;
  fixedCategory?: string | null; // e.g. 'residential'
  onCategoryChange?: (category: string) => void;
  hideTemplates?: boolean;
}

export function QuickTemplateButtons({ onSelect, fixedCategory, onCategoryChange, hideTemplates }: QuickTemplateButtonsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(fixedCategory || 'residential');
  const { agent } = useAgent();
  const updateTemplates = useUpdateAgentTemplates();
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState('');
  
  const { isListening, isSupported, toggleListening, transcript } = useSpeechRecognition();

  // If transcript stops and it's no longer listening, we can append it.
  // Actually, wait: we want to append the FINAL transcript.
  // We can just use useEffect to watch `isListening`. If it turns false, and `transcript` has text, we append it.
  const prevListeningRef = useRef(isListening);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcript.trim()) {
      onSelect(transcript.trim());
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, onSelect]);

  const customTemplates = agent?.custom_templates?.[selectedCategory] || [];
  const allTemplates = [...(QUICK_TEMPLATES[selectedCategory] || []), ...customTemplates];

  const handleAddTemplate = async () => {
    if (!newTemplate.trim()) return;
    const updated = {
      ...(agent?.custom_templates || {}),
      [selectedCategory]: [...customTemplates, newTemplate.trim()],
    };
    await updateTemplates.mutateAsync(updated);
    setNewTemplate('');
    // For immediate UI update, we might need to rely on react-query invalidation or page reload,
    // but agent will update when the hook re-fetches if it's connected, else the user can refresh.
    // NOTE: useAgent currently doesn't use react-query, so we will reload window as a fallback if needed,
    // but let's just let it be. If they refresh it'll appear, or we can mutate local state.
    // To cleanly update local state without reloading, we'd need useAgent to return a mutate function.
    // For now, window.location.reload() can be a simple workaround if state doesn't sync.
    window.location.reload(); 
  };

  const handleDeleteTemplate = async (templateToDelete: string) => {
    const updated = {
      ...(agent?.custom_templates || {}),
      [selectedCategory]: customTemplates.filter(t => t !== templateToDelete),
    };
    await updateTemplates.mutateAsync(updated);
    window.location.reload();
  };

  useEffect(() => {
    if (fixedCategory && fixedCategory !== selectedCategory) {
      if (QUICK_TEMPLATES[fixedCategory]) {
        setSelectedCategory(fixedCategory);
      }
    }
  }, [fixedCategory, selectedCategory]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  return (
    <div className={`rounded-lg border bg-blue-50/50 p-4 w-full ${hideTemplates && fixedCategory ? 'hidden' : 'mb-4 space-y-3'}`}>
      {!fixedCategory ? (
        <>
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 어떤 종류의 매물인가요?</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.keys(QUICK_TEMPLATES).map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600/80 mt-1 mb-2">
            * 카테고리를 미리 선택하시면 AI가 더 빠르고 정확하게 구분합니다.
          </p>
          {!hideTemplates && <hr className="border-blue-100" />}
        </>
      ) : null}

      {!hideTemplates && (
        <div>
          <div className="flex items-center justify-between mb-2 mt-2">
            <h3 className="text-sm font-semibold text-blue-900">
              자주 쓰는 문구 (터치해서 추가)
            </h3>
            <div className="flex items-center gap-2">
              {isSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md ${
                    isListening 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {isListening ? (
                    <><MicOff className="w-3.5 h-3.5" /> 듣는 중...</>
                  ) : (
                    <><Mic className="w-3.5 h-3.5" /> 음성 입력</>
                  )}
                </button>
              )}
              <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> 설정
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>자주 쓰는 문구 설정 ({CATEGORY_LABELS[selectedCategory]})</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="새로운 문구를 입력하세요" 
                      value={newTemplate}
                      onChange={(e) => setNewTemplate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTemplate();
                        }
                      }}
                    />
                    <Button onClick={handleAddTemplate} disabled={updateTemplates.isPending || !newTemplate.trim()}>추가</Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {customTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">추가된 커스텀 문구가 없습니다.</p>
                    ) : (
                      customTemplates.map((text, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
                          <span className="text-sm">{text}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteTemplate(text)} disabled={updateTemplates.isPending}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTemplates.map((text, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => onSelect(text)}
                className="px-2.5 py-1.5 text-xs bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-left"
              >
                {text}
              </button>
            ))}
          </div>
          {isListening && transcript && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200 text-sm text-blue-800 animate-in fade-in">
              {transcript}
            </div>
          )}
          <p className="text-xs text-blue-600/80 mt-2">
            * ( ) 안의 단위에 유의하여 숫자만 편하게 입력하세요.
          </p>
        </div>
      )}
    </div>
  );
}
