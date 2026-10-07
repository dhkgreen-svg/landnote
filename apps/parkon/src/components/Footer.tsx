'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Info, FileText, Key, BookOpen, Scale, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export function Footer() {
  const { isJapanese, isEnglish } = useTranslation();

  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/95 text-stone-600 text-xs py-8 px-4">
      <div className="max-w-xl mx-auto space-y-4 text-center">
        {/* 브랜드 & 슬로건 */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 font-black text-sm text-stone-900">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>{isJapanese ? 'パークゴルフ オールインワン' : '파크골프 올인원 (ParkGolf All-in-One)'}</span>
            <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-300">
              {isJapanese ? '公式ポータル' : isEnglish ? 'Official Portal' : '대한민국 No.1 포털'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {isJapanese
              ? '全国パークゴルフ場 天気・1秒スコアリング・スマート案内・公認ルール＆ガイド'
              : isEnglish
              ? 'Park Golf Live Weather · 1-sec Scoring · Smart Navigation · Rules & Guides'
              : '전국 400+ 구장 실시간 날씨 · 1초 스코어링 · 스마트 길안내 · 공인 룰북 & 전문 가이드'}
          </p>
        </div>

        {/* 1차 핵심 서비스 & 정보 링크 */}
        <div className="flex items-center justify-center gap-2 text-stone-700 font-bold text-xs flex-wrap pt-1">
          <Link
            href="/guide"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg text-emerald-800 border border-emerald-200"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isJapanese ? '専門ガイド＆コラム' : '파크골프 전문 가이드'}</span>
          </Link>
          <Link
            href="/rules"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg text-stone-700 border border-stone-200"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isJapanese ? '公認ルール＆ソロモン' : '공식 규정 & 룰 솔로몬'}</span>
          </Link>
          <Link
            href="/about"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg text-stone-700 border border-stone-200"
          >
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>{isJapanese ? 'サービス紹介・お問い合わせ' : '서비스 소개 & 제휴'}</span>
          </Link>
        </div>

        {/* 필수 법적 정책 링크 (구글 애드센스 심사 필수 항목) */}
        <div className="flex items-center justify-center gap-3 text-stone-600 font-bold text-[11px]">
          <Link
            href="/privacy"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isJapanese ? 'プライバシーポリシー' : isEnglish ? 'Privacy Policy' : '개인정보처리방침'}</span>
          </Link>
          <span className="text-stone-300">|</span>
          <Link
            href="/terms"
            className="hover:text-emerald-700 hover:underline transition flex items-center gap-0.5"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>{isJapanese ? '利用規約' : isEnglish ? 'Terms of Service' : '서비스 이용약관'}</span>
          </Link>
        </div>

        {/* E-E-A-T 운영자 신뢰성 및 투명성 안내 박스 */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-[10.5px] text-stone-600 text-left space-y-2 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-stone-200/80 pb-2">
            <div>
              <span className="font-bold text-stone-500">운영 주체 / 총괄 책임자:</span>{' '}
              <span className="font-bold text-stone-800">김대희 대표 (Kim Dae-hee)</span>
            </div>
            <div>
              <span className="font-bold text-stone-500">대표 도메인:</span>{' '}
              <span className="font-bold text-emerald-800">https://www.parkgolfallinone.com</span>
            </div>
            <div>
              <span className="font-bold text-stone-500">고객지원 & 제휴:</span>{' '}
              <span className="font-bold text-stone-800">contact@parkgolfallinone.com</span>
            </div>
            <div>
              <span className="font-bold text-stone-500">콘텐츠 감수:</span>{' '}
              <span className="font-bold text-stone-700">협회 공인 지도자 & 룰 검증팀</span>
            </div>
          </div>

          <div className="space-y-1 text-[10px] text-stone-500">
            <p>
              • <strong>{isJapanese ? '免責事項:' : '면책 고지:'}</strong>{' '}
              {isJapanese
                ? '本サービスが提供するコース情報、リアルタイム天気、AIルール案内は競技利便性のための参考情報であり、実際の競技判定は各主催者および審判委員会の決定を最優先とします。'
                : '파크골프 올인원에서 제공하는 전국 구장 상태, 실시간 날씨, AI 룰 솔로몬의 경기 규칙 안내는 경기 편의를 돕기 위한 참고 정보이며, 실제 대회 현장 판정은 해당 주최측 및 심판위원회의 결정을 최우선으로 따릅니다.'}
            </p>
            <p>
              • <strong>{isJapanese ? 'Google AdSense 広告及びCookieポリシー:' : 'Google AdSense 광고 및 쿠키 정책:'}</strong>{' '}
              {isJapanese
                ? '当サイトは持続可能な無料サービス提供のためGoogle AdSense広告を掲載しており、第三者配信事業者はCookieを使用して適切な広告を配信します。'
                : '파크골프 올인원은 지속 가능한 무료 서비스 제공을 위해 Google AdSense를 이용하며, Google 및 제3자 제공업체는 쿠키를 통해 맞춤형 광고를 제공합니다. 사용자는いつでも '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-700 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5"
              >
                Google 광고 설정
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              {isJapanese ? 'で無効化できます。' : '에서 맞춤 설정을 변경할 수 있습니다.'}
            </p>
          </div>
        </div>

        {/* 저작권 및 관리자 안내 */}
        <div className="text-[10px] text-stone-400 pt-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>© 2026 ParkGolf All-in-One Team. All rights reserved.</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200/90 hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-300 transition text-[10px] font-black shadow-2xs cursor-pointer active:scale-95"
              title="관리자 전용 관제실"
            >
              <Key className="w-3 h-3 text-amber-600 stroke-[2.5]" />
              <span>{isJapanese ? '管理者' : '관리자'}</span>
            </Link>
          </div>
          <p className="mt-0.5">
            전국 파크골프장 신규 등록 및 정보 수정 제보: contact@parkgolfallinone.com
          </p>
        </div>
      </div>
    </footer>
  );
}
