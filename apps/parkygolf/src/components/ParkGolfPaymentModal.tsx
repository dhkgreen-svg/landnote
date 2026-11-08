'use client';

import React from 'react';
import { MembershipPlanId } from '@/lib/portonePayment';

export interface ParkGolfPaymentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultPlanId?: MembershipPlanId;
}

export function ParkGolfPaymentModal(_props?: ParkGolfPaymentModalProps) {
  // [100% 무료 공익 서비스 운영 원칙] 어떤 props나 조건이 들어와도 무조건 아무것도 렌더링하지 않음 (원천 차단 킬 스위치)
  return null;
}
