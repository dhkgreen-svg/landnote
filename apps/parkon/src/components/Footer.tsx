'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Info, FileText } from 'lucide-react';
import { InstallGuideModal } from './InstallGuideModal';

export function Footer() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-stone-200 bg-white/90 text-stone-600 text-xs py-8 px-4">
        <div className="max-w-md mx-auto space-y-4 text-center">
          {/* 브랜드 & 슬로건 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 font-black text-sm text-stone-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>파크온 (ParkOn)</span>
              <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded-full">
                전국 파크골프 포털
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              전국 380+ 구장 정보 · 1초 스코어링 · AI 룰 솔로몬 · 클럽 대회 실시간 운영
            </p>
          </div>

          {/* 스마트폰 & PC 바탕화면 바로가기 추가 버튼 */}
          <div className="pt-2 pb-1">
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="w-full max-w-xs mx-auto py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-yellow-300 font-extrabold text-xs rounded-2xl shadow-md border border-emerald-600/80 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              title="스마트폰 또는 PC 바탕화면에 파크온 앱 추가"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="파키 심볼"
                className="w-5 h-5 rounded-lg border border-amber-300 object-cover shrink-0"
              />
              <span>스마트폰 · PC 바탕화면에 파크온 추가</span>
            </button>
          </div>

        {/* 필수 법적 정책 링크 (구글 애드센스 승인 필수 항목) */}
        <div className="flex items-center justify-center gap-3 text-stone-600 font-bold text-[11px] pt-1">
          <Link
            href="/privacy"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            개인정보처리방침
          </Link>
          <span className="text-stone-300">|</span>
          <Link
            href="/terms"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-0.5"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            서비스이용약관
          </Link>
          <span className="text-stone-300">|</span>
          <Link
            href="/about"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-0.5"
          >
            <Info className="w-3.5 h-3.5 text-stone-500" />
            서비스소개 & 문의
          </Link>
        </div>

        {/* 면책 고지 및 광고 안내 */}
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-[10px] text-stone-500 text-left space-y-1 leading-relaxed">
          <p>
            • <strong>면책 고지:</strong> 파크온에서 제공하는 전국 구장 상태, 실시간 날씨, AI 룰 솔로몬의 경기 규칙 안내는 경기 편의를 돕기 위한 참고 정보이며, 실제 대회 현장 판정은 해당 주최측 및 심판위원회의 결정을 최우선으로 따릅니다.
          </p>
          <p>
            • <strong>광고 및 제휴 안내:</strong> 파크온은 지속 가능한 무료 서비스 제공을 위해 Google AdSense 및 제휴 광고를 게재할 수 있으며, 쿠키를 활용한 맞춤형 서비스 환경을 제공합니다.
          </p>
        </div>

        {/* 저작권 및 운영 안내 (대표님 전용 관제실 진입점 포함) */}
        <div className="text-[10px] text-stone-400 pt-1 flex flex-col items-center gap-0.5">
          <p className="flex items-center gap-1">
            <span>© 2026 ParkOn Team. All rights reserved.</span>
            <Link
              href="/admin"
              className="text-stone-300 hover:text-stone-500 transition ml-0.5"
              title="관리자 전용 관제실"
            >
              🔒
            </Link>
          </p>
          <p className="mt-0.5">Contact: contact@parkongolf.com · 문의 및 파크골프장 정보 제보 환영</p>
        </div>
      </div>
    </footer>

    {/* PC 및 모바일 공용 앱 설치/바로가기 안내 모달 */}
    <InstallGuideModal
      isOpen={showInstallModal}
      onClose={() => setShowInstallModal(false)}
    />
  </>
  );
}
