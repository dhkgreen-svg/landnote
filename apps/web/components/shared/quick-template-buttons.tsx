import React, { useState, useEffect } from 'react';

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
          <h3 className="text-sm font-semibold text-blue-900 mb-2 mt-2">
            자주 쓰는 문구 (터치해서 추가)
          </h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES[selectedCategory]?.map((text, idx) => (
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
          <p className="text-xs text-blue-600/80 mt-2">
            * ( ) 안의 단위에 유의하여 숫자만 편하게 입력하세요.
          </p>
        </div>
      )}
    </div>
  );
}
