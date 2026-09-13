import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MapPin, Brain, Trophy, Smartphone, Mail, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: '서비스 소개 & 문의 | 파크온 (ParkOn)',
  description: '대한민국 파크골프 동호인을 위한 올인원 포털 파크온 소개 및 제휴 문의 안내입니다.',
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
          <span className="text-[11px] font-bold text-stone-500">About ParkOn</span>
        </div>

        {/* 헤더 히어로 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-emerald-600/60 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            대한민국 No.1 파크골프 포털
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            파크온 (ParkOn)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed font-medium">
            전국 380개 구장 정보부터 1초 스코어링, AI 룰 솔로몬, 그리고 클럽 월례회 대회 운영까지 — 동호인의 라운드가 매일 즐거워집니다.
          </p>
        </div>

        {/* 4대 핵심 서비스 가치 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-stone-200 space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-stone-900">전국 380+ 구장 실시간 포털</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              위치 기반 가까운 구장 추천, 실시간 날씨, 코스별 홀 정보, 잔디 컨디션 투표 현황을 한눈에 제공합니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-xs border border-stone-200 space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-stone-900">시니어 친화 1초 스코어보드</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              복잡한 입력 없이 4인 동반자 타수를 원터치로 기록하고, 실시간 타수 합산 및 코스별 파 분석 리포트를 지원합니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-xs border border-stone-200 space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-stone-900">AI 룰 솔로몬 질의응답</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              라운드 중 발생하는 애매한 규칙과 벌타 분쟁을 파크골프 공인 규정집 기반의 인공지능이 즉시 명쾌하게 판정해 줍니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-xs border border-stone-200 space-y-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-stone-900">클럽 대회 & 번개 올인원 운영</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              조 편성, 신페리오 및 정통 스트로크 실시간 리더보드, 행운상 룰렛 추첨, 참가비 입금 체크까지 총무 업무를 100% 전산화합니다.
            </p>
          </div>
        </div>

        {/* 제휴 및 광고 / 고객 문의 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200 space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-700" />
            <h2 className="font-black text-base text-stone-900">제휴 · 광고 · 고객 문의</h2>
          </div>
          <p className="text-stone-600 leading-relaxed">
            파크온은 전국 파크골프 협회, 클럽 총무님, 구장 관리 주체 및 파크골프 용품 브랜드와의 협업을 환영합니다.
          </p>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-500">공식 문의 이메일</span>
              <span className="font-black text-emerald-800" dangerouslySetInnerHTML={{ __html: '<!--email_off-->contact@parkongolf.com<!--/email_off-->' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-500">제휴 분야</span>
              <span className="font-bold text-stone-700">파크골프 용품 광고, 구장 정보 등록, 대회 후원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-500">응답 시간</span>
              <span className="font-bold text-stone-700">영업일 기준 24시간 이내 회신</span>
            </div>
          </div>
        </div>

        {/* 하단 홈으로 가기 */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-block py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
