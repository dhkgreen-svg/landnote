'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLAN_PRICE } from '@landnote/shared';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지금 이 기능은 잠겨 있습니다</DialogTitle>
          <DialogDescription>
            프로로 바꾸면 바로 해제됩니다
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>- 카테고리 4개 전체 사용</li>
          <li>- 카테고리별 QR 4개</li>
          <li>- 월 매물 등록 무제한</li>
          <li>- 카테고리 변경 제한 해제</li>
        </ul>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            닫기
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onClose();
              window.location.href = '/dashboard/settings';
            }}
          >
            월 {(PLAN_PRICE.pro - PLAN_PRICE.starter).toLocaleString()}원 더 내고 해제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
