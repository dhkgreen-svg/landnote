'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Heart, Crown, Coffee, ArrowRight, Loader2 } from 'lucide-react';
import { MEMBERSHIP_PLANS, MembershipPlanId, requestPortOnePayment, PORTONE_CONFIG } from '@/lib/portonePayment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ParkGolfPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlanId?: MembershipPlanId;
}

export function ParkGolfPaymentModal({ isOpen, onClose, defaultPlanId = 'VIP_PASS_MONTH' }: ParkGolfPaymentModalProps) {
  const { isJapanese } = useTranslation();
  const [selectedPlanId, setSelectedPlanId] = useState<MembershipPlanId>(defaultPlanId);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentPlan = MEMBERSHIP_PLANS[selectedPlanId];

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const result = await requestPortOnePayment({
        planId: selectedPlanId,
        customerName: customerName.trim() || '파크골프 동호인',
        customerPhone: customerPhone.trim() || '010-0000-0000',
      });

      if (result.success) {
        setPaymentResult({
          success: true,
          message: `✓ [${result.plan.name}] 결제가 성공적으로 완료되었습니다! 이용해 주셔서 감사합니다.`,
        });
      } else {
        setPaymentResult({
          success: false,
          message: result.error || '결제가 취소되었거나 처리되지 않았습니다.',
        });
      }
    } catch (err: any) {
      setPaymentResult({
        success: false,
        message: err?.message || '결제 모듈 호출 중 오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (priceKrw: number) => {
    if (isJapanese) {
      const jpy = Math.round(priceKrw / 10);
      return `¥${jpy.toLocaleString()} (${jpy.toLocaleString()}円)`;
    }
    return `${priceKrw.toLocaleString()}원`;
  };

  const formatPriceShort = (priceKrw: number) => {
    if (isJapanese) {
      const jpy = Math.round(priceKrw / 10);
      return `¥${jpy.toLocaleString()}`;
    }
    return `${priceKrw.toLocaleString()}원`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-emerald-200 flex flex-col max-h-[92vh]">
        {/* 상단 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-base shadow-xs">
              ⭐
            </span>
            <div>
              <h3 className="text-sm font-black leading-tight">
                {isJapanese ? 'VIPメンバーシップ ＆ 応援スポンサー' : 'VIP 멤버십 & 서비스 응원 후원'}
              </h3>
              <p className="text-[10px] text-emerald-200 font-medium">
                {isJapanese ? 'ポートワン公式決済 (Store ID 連動)' : '포트원(PortOne V2) 파크골프 공식 안전 결제'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-emerald-950/60 hover:bg-emerald-950 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label={isJapanese ? "閉じる" : "닫기"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 플랜 3종 카드 선택 */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-stone-800 flex items-center justify-between">
              <span>{isJapanese ? 'メンバーシップ プラン選択' : '멤버십 및 후원 플랜 선택'}</span>
              <span className="text-[10px] text-emerald-700 font-bold">{isJapanese ? '1秒簡単決済' : '1초 간편 결제'}</span>
            </label>

            {Object.values(MEMBERSHIP_PLANS).map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                      plan.id === 'COFFEE_SUPPORT'
                        ? 'bg-amber-100 text-amber-800'
                        : plan.id === 'VIP_PASS_MONTH'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {plan.id === 'COFFEE_SUPPORT' ? '☕' : plan.id === 'VIP_PASS_MONTH' ? '🏅' : '👑'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {isJapanese
                            ? plan.id === 'COFFEE_SUPPORT'
                              ? '開発応援'
                              : plan.id === 'VIP_PASS_MONTH'
                              ? '一番人気'
                              : '生涯特典'
                            : plan.badge}
                        </span>
                        <h4 className="font-extrabold text-xs text-stone-900 truncate">
                          {isJapanese
                            ? plan.id === 'COFFEE_SUPPORT'
                              ? 'コーヒー1杯の開発応援'
                              : plan.id === 'VIP_PASS_MONTH'
                              ? '月間VIP無制限パス'
                              : '生涯プレミアムパス'
                            : plan.name.replace('[파크골프 올인원] ', '')}
                        </h4>
                      </div>
                      <p className="text-[10px] text-stone-500 font-medium truncate mt-0.5">
                        {isJapanese
                          ? plan.id === 'COFFEE_SUPPORT'
                            ? 'サーバー維持とリアルタイム天気開発の応援'
                            : plan.id === 'VIP_PASS_MONTH'
                            ? '広告完全削除・プロスコア分析・AIコーチ'
                            : '生涯広告ゼロ・全大会機能永久利用'
                          : plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-stone-950">
                      {formatPriceShort(plan.price)}
                    </div>
                    <div className="text-[10px] text-stone-400 font-medium">
                      {plan.id === 'VIP_PASS_MONTH' ? (isJapanese ? '月額' : '월간') : (isJapanese ? '都度' : '일회성')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 선택한 플랜 혜택 안내 */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <div className="font-black text-stone-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isJapanese ? '含まれる専用特典:' : '포함된 전용 혜택:'}</span>
            </div>
            <ul className="space-y-1 text-stone-600 text-[11px]">
              {currentPlan.features.map((feat, fIdx) => (
                <li key={fIdx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {isJapanese
                      ? feat.includes('광고')
                        ? '全画面広告の完全削除'
                        : feat.includes('날씨')
                        ? '1時間単位の超精密ゴルフ天気予報'
                        : feat.includes('인공지능') || feat.includes('AI')
                        ? 'AIパーキーのコース攻略アドバイス'
                        : feat.includes('명예')
                        ? '公式スポンサー名誉バッジ付与'
                        : feat.includes('연대기')
                        ? '大会全記録の実録永久保存'
                        : feat
                      : feat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 간편 주문자 정보 입력 */}
          <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
            <span className="font-black text-stone-800">{isJapanese ? 'ご注文者確認 (任意):' : '주문자 확인 (선택):'}</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={isJapanese ? "お名前 (例: 山田太郎)" : "성명 (예: 김대희)"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none"
              />
              <input
                type="tel"
                placeholder={isJapanese ? "電話番号 (例: 090-1234-5678)" : "휴대폰 (예: 010-1234-5678)"}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* 보안 및 결제 안전 보증 고지 */}
          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 text-[10px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-snug">
              {isJapanese
                ? 'PortOne V2の安全な暗号化決済により、カード番号などの金融情報は保存されず安全に処理されます。'
                : '포트원(PortOne V2) PG 연동 보안 결제를 통해 카드번호 등 금융 정보는 일체 저장되지 않고 암호화 처리됩니다.'}
            </p>
          </div>

          {/* 결제 결과 피드백 알림 */}
          {paymentResult && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${
              paymentResult.success
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              {paymentResult.message}
            </div>
          )}
        </div>

        {/* 고정 하단 결제 버튼 */}
        <div className="p-3 border-t border-stone-100 shrink-0 bg-white space-y-2">
          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-sm transition active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isJapanese ? '決済処理中...' : '결제창 연결 중...'}</span>
              </>
            ) : (
              <>
                <span>{isJapanese ? `${formatPrice(currentPlan.price)} 決済する` : `${formatPrice(currentPlan.price)} 결제하기`}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
