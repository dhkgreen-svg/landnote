'use client';

import React, { useState } from 'react';
import { 
  Sparkles,
  Phone,
  ArrowRight,
  Check,
  Copy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StandaloneBeomeoBuildingPage() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const teaserText = `[VIP 프라이빗 브리핑] 대구 수성구청역 도보 1분, 160억 준신축 통빌딩 매매\n\n- 매매가: 160억 원 (보증금 9.5억 / 월세 4,040만)\n- 대지 127평 / 연면적 840평 / 주차 25대\n- 전 층 우량 임차인 입점 완료 (공실 ZERO)\n- 나우부동산 전용 브리핑 블로그 보기:\nhttps://m.blog.naver.com/dhk00200/224362005757`;
    navigator.clipboard.writeText(teaserText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between">
      
      {/* ────────────────────── STANDALONE HEADER ────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
              나우
            </div>
            <div>
              <span className="font-bold text-white text-base sm:text-lg block leading-none">나우공인중개사사무소</span>
              <span className="text-[11px] text-amber-400 font-medium">검증된 수성구 전문 프라이빗 매물</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="tel:010-9999-3399" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-3 py-2 rounded-lg shadow-sm">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>010-9999-3399</span>
            </a>
          </div>
        </div>
      </header>

      {/* ────────────────────── BRIDGE CONTENT (Hero-only bridge page) ────────────────────── */}
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-slate-900/40 border border-slate-850 p-6 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column: Title and 2 Buttons */}
              <div className="md:col-span-7 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>대구 수성구 범어동 160억 통빌딩 프라이빗 안내</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-[1.3]">
                  대구 수성구의 심장, 범어동 대로변
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                    160억 원대 준신축 메디컬·학원 빌딩
                  </span>
                </h1>

                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  수성구청역 도보 1분 초역세권 대로변 입지. 전 층 우량 메디컬·학원 입점으로 공실 없는 ‘똘똘한 한 채’ 매물입니다.
                </p>

                {/* 2 Main Action Buttons requested by user */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
                  <a 
                    href="tel:010-9999-3399" 
                    className="inline-flex items-center justify-center h-13 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    전화로 문의하기
                  </a>
                  <a 
                    href="https://m.blog.naver.com/dhk00200/224362005757" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center h-13 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-base transition-all"
                  >
                    <span>상세 내역 보기 (블로그)</span>
                    <ArrowRight className="w-4 h-4 ml-2 text-amber-400" />
                  </a>
                </div>
              </div>

              {/* Right Column: Premium Lobby Interior Banner */}
              <div className="md:col-span-5 flex justify-center w-full">
                <div className="relative group overflow-hidden rounded-2xl border border-slate-800 shadow-2xl max-w-sm w-full">
                  <img 
                    src="/beomeo_interior.jpg" 
                    alt="대구 수성구 범어동 160억 빌딩 실내 로비 전경" 
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">프라이빗 빌딩 실내 전경</span>
                      <span className="text-amber-400 font-bold">보안 유지 VIP 단독 매물</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Micro Specs */}
            <div className="grid grid-cols-3 gap-3 pt-6 mt-8 border-t border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">매매 희망가</span>
                <span className="font-bold text-amber-400 text-sm">160억 원</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">대지/연면적</span>
                <span className="font-bold text-white text-sm">127평 / 840평</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">보증금/월세</span>
                <span className="font-bold text-emerald-400 text-sm">9.5억 / 4,040만</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ────────────────────── STANDALONE FOOTER ────────────────────── */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-slate-500 text-[11px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-bold text-slate-300 text-xs mb-1">나우공인중개사사무소 (대표: 신속중개 나우부동산)</p>
            <p>대구 수성구 범어동 160억 통빌딩 매매 전용 프라이빗 안내 페이지</p>
          </div>
          <div className="md:text-right flex flex-col items-center md:items-end gap-1.5">
            <button 
              onClick={handleCopyLink} 
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '공유 문구 복사 완료!' : '블로그 공유 문구 복사'}</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
