import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: '서비스 이용약관 | 파크온 (ParkOn)',
  description: '파크온 서비스 이용약관 및 서비스 이용 안내입니다.',
};

export default function TermsOfServicePage() {
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
          <span className="text-[11px] font-bold text-stone-500">최종 개정일: 2026년 9월 12일</span>
        </div>

        {/* 헤더 카드 */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-3xl shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
            <FileText className="w-4 h-4" />
            파크온 운영 규정
          </div>
          <h1 className="text-2xl font-black tracking-tight">서비스 이용약관</h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            파크온(ParkOn) 서비스를 이용해 주셔서 감사합니다. 본 약관은 회원의 권리, 의무 및 책임사항을 규정합니다.
          </p>
        </div>

        {/* 본문 섹션 카드들 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-6 text-xs leading-relaxed">
          {/* 제 1 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 1 조 (목적)
            </h2>
            <p className="text-stone-600">
              본 약관은 파크온(이하 &ldquo;서비스&rdquo;)이 제공하는 전국 파크골프장 정보 검색, 1초 스코어링, AI 룰 솔로몬, 클럽 대회 및 번개 모임 관리 등의 모든 서비스 이용 조건 및 절차를 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제 2 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 2 조 (서비스의 제공 및 특성)
            </h2>
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-stone-700">
              <p>• <strong>전국 380+ 구장 정보:</strong> 실시간 코스 구성, 잔디 상태, 날씨 및 평점 정보를 제공합니다.</p>
              <p>• <strong>스마트 1초 스코어보드:</strong> 4인 동반자 타수를 원터치로 기록하고 집계합니다.</p>
              <p>• <strong>AI 룰 솔로몬:</strong> 파크골프 공인 경기 규칙 및 상황별 판정 가이드를 인공지능 질의응답으로 지원합니다.</p>
              <p>• <strong>클럽 대회 및 번개 운영:</strong> 조 편성, 신페리오 및 스트로크 리더보드, 행운상 룰렛, 참가비 입금 현황 관리를 지원합니다.</p>
            </div>
          </section>

          {/* 제 3 조 (면책 조항 - 핵심) */}
          <section className="space-y-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
            <h2 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              제 3 조 (면책 조항 및 책임의 한계)
            </h2>
            <ul className="list-disc pl-4 space-y-1.5 text-amber-950/90 text-[11px]">
              <li>
                <strong>AI 룰 솔로몬의 경기 판정:</strong> AI 룰 솔로몬이 제공하는 경기 규칙 해석 및 벌타 안내는 이용자의 이해를 돕기 위한 참고 정보이며 법적 구속력을 갖지 않습니다. 실제 대회 현장의 판정은 해당 주최측 경기심판위원회의 공식 판정을 최우선으로 합니다.
              </li>
              <li>
                <strong>구장 정보 및 현장 상황:</strong> 전국 구장의 휴장일, 잔디 보식, 날씨, 이용 요금 등은 현장 사정에 따라 변동될 수 있으며, 파크온은 이에 따른 간접적 손해에 대해 책임을 지지 않습니다.
              </li>
              <li>
                <strong>클럽 회원 간 거래 및 모임:</strong> 클럽 내 참가비 입금, 정산, 회원 간의 분쟁은 해당 모임의 주최자 및 회원 간의 자율적 책임 하에 이루어집니다.
              </li>
            </ul>
          </section>

          {/* 제 4 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 4 조 (광고 게재 및 제휴)
            </h2>
            <p className="text-stone-600">
              서비스는 이용자에게 무료로 우수한 기능을 제공하기 위해 서비스 화면 내에 Google AdSense를 포함한 배너 광고, 제휴 링크 등을 게재할 수 있습니다. 이용자는 서비스 이용 시 노출되는 광고 게재에 동의하는 것으로 간주합니다.
            </p>
          </section>

          {/* 제 5 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 5 조 (회원의 의무 및 이용 제한)
            </h2>
            <p className="text-stone-600">
              회원은 다음 행위를 하여서는 안 되며, 적발 시 서비스 이용이 제한될 수 있습니다:
            </p>
            <div className="space-y-1 text-[11px] text-stone-600 pl-2">
              <p>1. 타인의 명의나 계정을 도용하여 부정 가입하는 행위</p>
              <p>2. 서비스의 정상적인 운영을 방해하거나 서버에 고의로 부하를 유발하는 행위</p>
              <p>3. 타 회원에게 모욕, 명예훼손, 음란물 등 불쾌감을 주는 게시물을 작성하는 행위</p>
            </div>
          </section>

          {/* 제 6 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 6 조 (준거법 및 재판관할)
            </h2>
            <p className="text-stone-600">
              본 약관은 대한민국 법령을 준거법으로 하며, 서비스 이용과 관련하여 분쟁이 발생할 경우 대한민국 법원을 관할 법원으로 합니다.
            </p>
          </section>
        </div>

        {/* 하단 뒤로가기 버튼 */}
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
