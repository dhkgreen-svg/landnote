'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';

export default function AiInputPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!preview) return;

    setIsLoading(true);
    try {
      // preview is already a base64 data URI
      const response = await apiFetch<{
        type: 'listing' | 'looking_for';
        category_codes?: string[];
        transaction_types?: string[];
        price_sale?: number;
        deposit?: number;
        monthly_rent?: number;
        area_exclusive?: number;
        address_full?: string;
        customer_name?: string;
        customer_phone?: string;
        agent_memo?: string;
      }>('/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview }),
      });

      // Save to sessionStorage
      const draftId = `ai_draft_${Date.now()}`;
      sessionStorage.setItem(draftId, JSON.stringify(response));

      toast({
        title: '분석 완료',
        description: '추출된 데이터를 바탕으로 입력 양식으로 이동합니다.',
      });

      // Redirect based on inferred type
      if (response.type === 'looking_for') {
        router.push(`/dashboard/inquiries/new?aiDraft=${draftId}`);
      } else {
        router.push(`/dashboard/listings/new?aiDraft=${draftId}`);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: '분석 실패',
        description: '사진 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
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
          수기 매물장, 전단지, 고객 명함 등을 촬영하면 AI가 알아서 입력 양식을 채워줍니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사진 업로드</CardTitle>
          <CardDescription>분석할 이미지를 선택하거나 카메라로 촬영해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Button variant="outline" className="w-full" onClick={() => setPreview(null)} disabled={isLoading}>
                  취소
                </Button>
                <Button className="w-full" onClick={processImage} disabled={isLoading}>
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
        </CardContent>
      </Card>
    </div>
  );
}
