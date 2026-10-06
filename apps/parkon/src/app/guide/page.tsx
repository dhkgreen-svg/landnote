import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BookOpen, Sparkles, Clock, ArrowRight, ShieldCheck, Tag, ArrowLeft } from 'lucide-react';
import { PARK_GOLF_GUIDES } from '@/data/parkGolfGuides';

export const metadata: Metadata = {
  title: '파크골프 전문 가이드 & 실전 칼럼 10선 | 파크골프 올인원 (ParkGolf All-in-One)',
  description: '입문부터 장비 선택, 그립과 장타 스윙, 숏게임, 퍼팅 라이 읽기, OB 벌타 규정, 이븐파 코스 매니지먼트까지 공인 전문가가 엄선한 고품질 파크골프 가이드 칼럼 모음.',
  alternates: {
    canonical: 'https://www.parkgolfallinone.com/guide',
  },
  openGraph: {
    title: '파크골프 전문 가이드 & 실전 칼럼 | 파크골프 올인원',
    description: '입문 요령부터 룰 판정, 클럽 선택법, 장타 스윙까지 완벽 정리한 공인 가이드 10선',
    url: 'https://www.parkgolfallinone.com/guide',
    siteName: '파크골프 올인원',
    type: 'website',
  },
};

export default function GuideIndexPage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
          <span className="text-[11px] font-bold text-stone-500">
            ParkGolf Official Knowledge Hub
          </span>
        </div>

        {/* 헤더 히어로 배너 */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-emerald-600/70 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4" />
            파크골프 백과 · 공인 실전 가이드
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            파크골프 전문 가이드 & 실전 칼럼
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium max-w-xl">
            초보 입문부터 공인 용구 선택, 드라이버 장타 스윙, 숏게임 런닝 어프로치, 필드 4대 벌타 룰, 그리고 이븐파 코스 매니지먼트까지 — 공인 지도자와 분석관이 엄선 집필한 10편의 정통 정보성 칼럼입니다.
          </p>
          <div className="flex items-center gap-3 pt-2 text-[11px] text-emerald-200">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              총 10편의 전문 칼럼 수록
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              KPGA / NPGA 공인 기준 검증
            </span>
          </div>
        </div>

        {/* 10편 칼럼 리스트 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
              <span>📚</span>
              <span>전체 가이드 목록 (10선)</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              전문가 칼럼
            </span>
          </div>

          <div className="space-y-3">
            {PARK_GOLF_GUIDES.map((guide, idx) => (
              <article
                key={guide.slug}
                className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200 hover:border-emerald-600 transition group hover:shadow-md"
              >
                <Link href={`/guide/${guide.slug}`} className="block space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {guide.category}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {guide.readTime}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-emerald-700 transition leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-700">{guide.author}</span>
                      <span className="text-[11px] text-stone-400">· {guide.publishedAt}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      칼럼 읽기 <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* 하단 배너: AI 룰 솔로몬 & 전국 구장 링크 */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h4 className="font-black text-sm text-amber-950">
              필드 라운드 중 실시간 룰 판정이 필요하신가요?
            </h4>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            동반자와의 실랑이나 OB 판정, 해저드 구제 등 현장 분쟁은 <strong>파크골프 올인원 AI 룰 솔로몬</strong>을 통해 1초 만에 공인 판정 기준을 확인하실 수 있습니다.
          </p>
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <Link
              href="/rules"
              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition"
            >
              ⚖️ 룰 솔로몬 바로가기
            </Link>
            <Link
              href="/courses"
              className="py-2 px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black shadow-xs transition"
            >
              ⛳ 전국 구장 검색
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
