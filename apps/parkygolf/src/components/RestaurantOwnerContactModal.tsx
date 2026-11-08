'use client';

import React from 'react';
import { X, Sparkles, Phone, MessageSquare, CheckCircle2, TrendingUp, Award } from 'lucide-react';

interface RestaurantOwnerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName?: string;
}

export function RestaurantOwnerContactModal({ isOpen, onClose, courseName }: RestaurantOwnerContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border-2 border-emerald-500 text-stone-900 relative space-y-4 animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            👑
          </div>
          <div>
            <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full inline-block mb-1">
              상권 입점 & 파워링크 옥션
            </span>
            <h3 className="text-lg font-black text-stone-950">
              {courseName ? `${courseName} 상단 고정 안내` : '구장 1등 상단 고정 옥션 안내'}
            </h3>
            <p className="text-xs text-stone-600 font-semibold mt-1">
              매일 구장을 방문하는 수백 명의 골퍼들에게 우리 식당을 가장 먼저 노출해 보세요!
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 text-xs space-y-2.5">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-emerald-950">구장 맛집 탭 최상단 고정 노출</span>
              <p className="text-[11px] text-emerald-800 font-medium">라운드 전·후 동호인들이 식당을 찾을 때 1순위로 표시됩니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-emerald-950">18홀 완주 직후 추천 배너 송출</span>
              <p className="text-[11px] text-emerald-800 font-medium">당일 라운드를 끝낸 4인 조원들에게 뒤풀이 장소로 다이렉트 추천됩니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-emerald-950">👑 구장 공식 파트너 인증 뱃지</span>
              <p className="text-[11px] text-emerald-800 font-medium">시니어 골퍼들의 높은 신뢰도와 단체 예약 우선 매칭을 제공합니다.</p>
            </div>
          </div>
        </div>

        {/* Quick Contact Action */}
        <div className="space-y-2 pt-1">
          <a
            href="tel:010-4824-1004"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-3.5 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-yellow-300" />
            <span>상단 고정 입찰 & 등록 전화 문의</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-stone-500 hover:text-stone-800 font-bold text-xs rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
