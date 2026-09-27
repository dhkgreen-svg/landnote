'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Info, FileText, Key } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/90 text-stone-600 text-xs py-8 px-4">
        <div className="max-w-md mx-auto space-y-4 text-center">
          {/* 브랜드 & 슬로건 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 font-black text-sm text-stone-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>파크골프 올인원 (ParkGolf All-in-One)</span>
              <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded-full">
                대한민국 No.1 포털
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              전국 400+ 구장 날씨 · 1초 스코어링 · 스마트 길안내 · 전국 랭킹 올인원
            </p>
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
        <div className="text-[10px] text-stone-400 pt-2 flex flex-col items-center gap-1.5 border-t border-stone-100">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>© 2026 ParkOn Team. All rights reserved.</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200/90 hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-300 transition text-[11px] font-black shadow-2xs cursor-pointer active:scale-95"
              title="관리자 전용 관제실 (PIN 로그인)"
            >
              <Key className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
              <span>관리자 관제실</span>
            </Link>
          </div>
          <p className="mt-0.5">Contact: contact@parkongolf.com · 문의 및 파크골프장 정보 제보 환영</p>
        </div>
      </div>
    </footer>
  );
}
