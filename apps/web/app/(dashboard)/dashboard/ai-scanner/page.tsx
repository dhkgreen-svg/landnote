'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, UploadCloud, Loader2, ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function AiInputPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [selectedCategory, setSelectedCategory] = useState<string>('아파트/주택');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const QUICK_TEMPLATES: Record<string, string[]> = {
    '아파트/주택': [
      '매매가 (만원) = ', '보증금 (만원) = ', '월세 (만원) = ',
      '공급면적 (㎡) = ', '전용면적 (㎡) = ',
      '방 (개) = ', '화장실 (개) = ', '해당층/총층 = ',
      '정남향', '올수리됨', '즉시입주 가능', '주차 1대 무료'
    ],
    '상가/사무실': [
      '보증금 (만원) = ', '월세 (만원) = ', '권리금 (만원) = ',
      '전용면적 (㎡) = ', '현재업종 = ', '추천업종 = ',
      '엘리베이터 있음', '무료주차 1대', '내부 화장실', '수도/도시가스 인입'
    ],
    '공장/토지': [
      '매매가 (만원) = ', '보증금 (만원) = ', '월세 (만원) = ',
      '대지면적 (㎡) = ', '연면적 (㎡) = ',
      '층고 (m) = ', '동력 (kw) = ', '호이스트 (톤) = ',
      '대형 트레일러 진입가능', '단독 마당 사용'
    ]
  };

  const appendTemplate = (text: string) => {
    setTextContent(prev => prev ? prev + '\n' + text : text);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processInput = async () => {
    if (mode === 'image' && !preview) return;
    if (mode === 'text' && !textContent.trim()) return;

    setIsLoading(true);
    setStatusMsg('AI 분석 요청 중...');
    try {
      setStatusMsg('서버로 데이터 전송 중...');
      const payload: any = {};
      
      if (mode === 'image' && preview) {
        payload.imageBase64 = preview;
      } else if (mode === 'text' && textContent.trim()) {
        payload.textContent = textContent.trim();
      }
      
      payload.categoryHint = selectedCategory;

      const res = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setStatusMsg(`서버 응답 수신 (${res.status})...`);
      const json = await res.json();

      if (!json.ok) {
        const errMsg = json.error?.message || 'AI 분석 오류';
        setStatusMsg(`오류: ${errMsg}`);
        toast({
          title: '분석 실패',
          description: errMsg,
          variant: 'destructive',
        });
        return;
      }

      const data = json.data;
      setStatusMsg('분석 완료! 페이지 이동 중...');

      // Save to sessionStorage
      const draftId = `ai_draft_${Date.now()}`;
      sessionStorage.setItem(draftId, JSON.stringify(data));

      toast({
        title: '분석 완료',
        description: '추출된 데이터를 바탕으로 입력 양식으로 이동합니다.',
      });

      // Redirect based on inferred type
      if (data.type === 'looking_for') {
        router.push(`/dashboard/inquiries/new?aiDraft=${draftId}`);
      } else {
        router.push(`/dashboard/listings/new?aiDraft=${draftId}`);
      }
    } catch (error) {
      console.error('processInput error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setStatusMsg(`예외: ${msg}`);
      window.alert(`AI 분석 오류:\n${msg}`);
      toast({
        title: '분석 실패',
        description: msg || '분석 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI 간편 입력</h1>
        <p className="text-muted-foreground">
          수기 매물장, 고객 문자 메시지 등을 넣으면 AI가 알아서 입력 양식을 채워줍니다.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          ⏳ {statusMsg}
        </div>
      )}

      <div className="flex rounded-lg border bg-muted p-1">
        <Button
          variant={mode === 'image' ? 'default' : 'ghost'}
          className="w-1/2"
          onClick={() => setMode('image')}
          disabled={isLoading}
        >
          <Camera className="mr-2 h-4 w-4" />
          사진으로 입력
        </Button>
        <Button
          variant={mode === 'text' ? 'default' : 'ghost'}
          className="w-1/2"
          onClick={() => setMode('text')}
          disabled={isLoading}
        >
          <Type className="mr-2 h-4 w-4" />
          문자로 입력
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mode === 'image' ? '사진 업로드' : '문자 붙여넣기'}</CardTitle>
          <CardDescription>
            {mode === 'image' 
              ? '분석할 이미지를 선택하거나 카메라로 촬영해주세요.' 
              : '카카오톡이나 문자로 받은 매물 정보를 그대로 붙여넣어주세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-blue-50/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 어떤 종류의 매물인가요?</h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(QUICK_TEMPLATES).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-600/80 mt-1">
              * 카테고리를 미리 선택하시면 AI가 더 빠르고 정확하게 구분합니다.
            </p>
          </div>

          {mode === 'image' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span>사진 촬영</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <span>갤러리 선택</span>
                </Button>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </div>

              {preview && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    선택된 이미지 미리보기
                  </h3>
                  <div className="relative aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    <img src={preview} alt="Preview" className="object-contain max-h-64" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="w-full" onClick={() => { setPreview(null); setStatusMsg(''); }} disabled={isLoading}>
                      취소
                    </Button>
                    <Button className="w-full" onClick={processInput} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          AI 분석 중...
                        </>
                      ) : (
                        '이 사진으로 분석하기'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-blue-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">자주 쓰는 문구 (터치해서 추가)</h3>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES[selectedCategory].map((text, idx) => (
                    <button
                      key={idx}
                      onClick={() => appendTemplate(text)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-left"
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-600/80 mt-2">
                  * 00으로 표시된 부분을 실제 정보로 수정해주시면 AI가 더 정확하게 인식합니다.
                </p>
              </div>

              <Textarea 
                placeholder="버튼을 눌러 템플릿을 입력하거나, 복사한 매물 정보를 그대로 붙여넣어주세요." 
                className="min-h-[250px] font-mono text-sm"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isLoading}
              />
              <Button className="w-full" onClick={processInput} disabled={isLoading || !textContent.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  '이 문자로 분석하기'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
