'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  Car, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Calculator, 
  Download, 
  PhoneCall, 
  CheckCircle2, 
  Sparkles,
  Check,
  Copy,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Rent Roll Data from User Table
const RENT_ROLL = [
  { floor: '1층', area: '26.6평', deposit: 10000, rent: 260, maintenance: 29.26, term: '2024.11.25 ~ 2027.11.30', status: '입점완료' },
  { floor: '2층', area: '99.6평', deposit: 10000, rent: 490, maintenance: 109.56, term: '2023.12.15 ~ 2028.12.14', status: '입점완료' },
  { floor: '3층', area: '99.6평', deposit: 10000, rent: 470, maintenance: 109.56, term: '2025.04.01 ~ 2028.03.31', status: '입점완료' },
  { floor: '4층', area: '99.6평', deposit: 10000, rent: 400, maintenance: 109.56, term: '2022.10.11 ~ 2024.10.11', status: '재계약/정상화 대상' },
  { floor: '5층', area: '99.6평', deposit: 10000, rent: 400, maintenance: 109.56, term: '2022.10.20 ~ 2024.10.19', status: '재계약/정상화 대상' },
  { floor: '6층', area: '99.6평', deposit: 10000, rent: 400, maintenance: 109.56, term: '2022.08.30 ~ 2024.08.29', status: '재계약/정상화 대상' },
  { floor: '7층', area: '99.6평', deposit: 7000, rent: 400, maintenance: 109.56, term: '2023.08.16 ~ 2025.08.15', status: '입점완료' },
  { floor: '8층', area: '99.6평', deposit: 10000, rent: 400, maintenance: 109.56, term: '사용승인일 ~ 2026년', status: '입점완료' },
  { floor: '9층', area: '99.6평', deposit: 10000, rent: 400, maintenance: 109.56, term: '2022.09 ~ 2024.09', status: '재계약/정상화 대상' },
  { floor: '10층', area: '95평', deposit: 8000, rent: 420, maintenance: 104.5, term: '2022.10.23 ~ 2024.10.22', status: '재계약/정상화 대상' },
];

export default function StandaloneBeomeoBuildingPage() {
  // Financial Calculator State
  const buildingPrice = 16000000000; // 160억 원
  const totalDeposit = 950000000; // 9.5억 원
  const currentMonthlyRent = 40400000; // 월세 4,040만 원

  const [ltvPercent, setLtvPercent] = useState<number>(60); // Default 60%
  const [interestRate, setInterestRate] = useState<number>(3.8); // Default 3.8%
  const [targetRentIncrease, setTargetRentIncrease] = useState<number>(25); // 인상률 25%

  // Calculated values
  const loanAmount = buildingPrice * (ltvPercent / 100);
  const actualEquity = buildingPrice - loanAmount - totalDeposit; // 실투자금
  const annualInterest = loanAmount * (interestRate / 100);
  const monthlyInterest = annualInterest / 12;

  // Current Net Income
  const currentMonthlyNetIncome = currentMonthlyRent - monthlyInterest;
  const currentAnnualNetIncome = currentMonthlyNetIncome * 12;
  const currentRoe = actualEquity > 0 ? ((currentAnnualNetIncome / actualEquity) * 100).toFixed(2) : '0';

  // Future Upside Net Income
  const futureMonthlyRent = currentMonthlyRent * (1 + targetRentIncrease / 100);
  const futureMonthlyNetIncome = futureMonthlyRent - monthlyInterest;
  const futureAnnualNetIncome = futureMonthlyNetIncome * 12;
  const futureRoe = actualEquity > 0 ? ((futureAnnualNetIncome / actualEquity) * 100).toFixed(2) : '0';

  // Lead Form State
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    setLeadSubmitted(true);
  };

  const handleCopyLink = () => {
    const teaserText = `[VIP 프라이빗 브리핑] 대구 수성구청역 도보 1분, 160억 준신축 통빌딩 매매\n\n- 매매가: 160억 원 (보증금 9.5억 / 월세 4,040만)\n- 대지 127평 / 연면적 840평 / 주차 25대\n- 전 층 우량 임차인 입점 완료 (공실 ZERO)\n- 나우부동산 전용 브리핑 웹사이트 보기:\n${window.location.href}`;
    navigator.clipboard.writeText(teaserText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const formatEok = (val: number) => {
    const eok = val / 100000000;
    return `${eok.toFixed(eok % 1 === 0 ? 0 : 1)}억 원`;
  };

  const formatMan = (val: number) => {
    return `${Math.floor(val / 10000).toLocaleString()}만 원`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* ────────────────────── STANDALONE HEADER (나우부동산 전용) ────────────────────── */}
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
            <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 rounded-lg transition-colors shadow-sm">
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? '복사완료!' : '카톡 공유하기'}
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────────── 1. HERO SECTION ────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-12 pb-16 md:pt-20 md:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>대구 수성구 범어동 160억 통빌딩 전용 브리핑</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.2] mb-6">
            대구 수성구의 심장, 범어동 대로변
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              160억 원대 준신축 메디컬·학원 빌딩
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-3xl leading-relaxed mb-8">
            수성구청역 도보 1분 초역세권. 공실 스트레스 없는 <strong className="text-white font-semibold">‘똘똘한 한 채’</strong>의 표본.<br className="hidden sm:inline" />
            2019년 준신축, 전 층 우량 임차인 입점 완료 및 주차 25대 완비.
          </p>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mb-10">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-xs text-slate-400 block mb-1">매매 희망가</span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400">160억 원</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-xs text-slate-400 block mb-1">대지 / 연면적</span>
              <span className="text-lg sm:text-xl font-bold text-white">127평 / 840평</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-xs text-slate-400 block mb-1">현 보증금 / 월세</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400">9.5억 / 4,040만</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-xs text-slate-400 block mb-1">준공 / 주차</span>
              <span className="text-lg sm:text-xl font-bold text-white">2019년 / 25대</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#calculator" className="inline-flex items-center justify-center h-13 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/20">
              <Calculator className="w-5 h-5 mr-2" />
              실시간 투자 수익률 계산하기
            </a>
            <a href="#lead-form" className="inline-flex items-center justify-center h-13 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-base transition-all">
              <Download className="w-5 h-5 mr-2 text-amber-400" />
              상세 임대 내역서(PDF) 신청
            </a>
          </div>
        </div>
      </section>

      {/* ────────────────────── 2. INTERACTIVE CALCULATOR SECTION ────────────────────── */}
      <section id="calculator" className="py-16 md:py-24 bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-3 px-3 py-1">
              FINANCIAL SIMULATOR
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
              슬라이더를 조절하여 <span className="text-amber-400">필요 실투자금 & 월 순수익</span>을 확인하세요
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              보증금 9.5억 원 승계 조건. 대출 비율과 금리를 조절하면 실시간으로 내 손에 남는 월 순수수익이 계산됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive Controls */}
            <div className="lg:col-span-6 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                <Calculator className="w-5 h-5 text-amber-400" />
                금융 조건 설정
              </h3>

              {/* LTV Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">대출 비율 (LTV)</span>
                  <span className="font-bold text-amber-400 text-base">{ltvPercent}% ({formatEok(loanAmount)})</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="70" 
                  step="5" 
                  value={ltvPercent} 
                  onChange={(e) => setLtvPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>보수적 (40%)</span>
                  <span>권장 (60%)</span>
                  <span>최대 (70%)</span>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">대출 예상 금리</span>
                  <span className="font-bold text-amber-400 text-base">{interestRate.toFixed(1)}%</span>
                </div>
                <input 
                  type="range" 
                  min="3.0" 
                  max="5.5" 
                  step="0.1" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>최저 3.0%</span>
                  <span>평균 3.8%</span>
                  <span>상한 5.5%</span>
                </div>
              </div>

              {/* Upside Expectation Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">만기 시 임대료 인상 예상치 (Upside)</span>
                  <span className="font-bold text-emerald-400 text-base">+{targetRentIncrease}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  step="5" 
                  value={targetRentIncrease} 
                  onChange={(e) => setTargetRentIncrease(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <p className="text-xs text-slate-400">
                  💡 2022~2023년 계약층(4~10층) 만기 시 정상화 시 인상 가능 폭
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">📌 고정 적용 데이터</p>
                <p>• 매매 희망가: 160억 원</p>
                <p>• 인수 보증금: 9억 5,000만 원 (승계)</p>
                <p>• 현 임대료: 월 4,040만 원 (관리비 1,010만 원 별도)</p>
              </div>
            </div>

            {/* Right Column: Calculated Results */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Main Cashflow Card */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
                <h4 className="text-sm font-semibold text-amber-400 tracking-wider uppercase mb-6">
                  현재 기준 실투자금 및 월 순수익
                </h4>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">필요 실투자금 (자기자본)</span>
                    <span className="text-2xl font-black text-white">{formatEok(actualEquity)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">월 임대 수입 (월세)</span>
                    <span className="text-lg font-bold text-slate-200">{formatMan(currentMonthlyRent)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">월 대출 이자 지출</span>
                    <span className="text-lg font-bold text-red-400">-{formatMan(monthlyInterest)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-slate-200 font-bold block">월 순수수익 (차감 후)</span>
                      <span className="text-xs text-slate-400">대출 이자 제하고 내 손에 남는 돈</span>
                    </div>
                    <span className="text-3xl font-black text-emerald-400">
                      +{formatMan(currentMonthlyNetIncome)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-300">자기자본 수익률 (ROE)</span>
                  <span className="text-2xl font-black text-amber-400">{currentRoe}%</span>
                </div>
              </div>

              {/* Upside Potential Comparison Card */}
              <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-6 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                  <TrendingUp className="w-5 h-5" />
                  <span>만기 후 임대료 정상화 시 (+{targetRentIncrease}% 상승 시나리오)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">예상 월 순수수익</span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      +{formatMan(futureMonthlyNetIncome)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">예상 ROE</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">
                      {futureRoe}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────── 3. RENT ROLL TABLE SECTION ────────────────────── */}
      <section className="py-16 md:py-24 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 mb-3 px-3 py-1">
                RENT ROLL BREAKDOWN
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                1층 ~ 10층 전체 임대차 상세 현황표
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              전 층 우량 임차인 입점 완료. 총 보증금 <strong className="text-white">9억 5,000만 원</strong> / 총 월세 <strong className="text-emerald-400">4,040만 원</strong> (관리비 1,010만 원 별도)
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-4 px-4 font-semibold">층수</th>
                    <th className="py-4 px-4 font-semibold">계약면적</th>
                    <th className="py-4 px-4 font-semibold">보증금</th>
                    <th className="py-4 px-4 font-semibold">월세</th>
                    <th className="py-4 px-4 font-semibold">월 관리비</th>
                    <th className="py-4 px-4 font-semibold">계약기간</th>
                    <th className="py-4 px-4 font-semibold text-right">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {RENT_ROLL.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{item.floor}</td>
                      <td className="py-3.5 px-4 text-slate-300">{item.area}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{item.deposit.toLocaleString()}만 원</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">{item.rent.toLocaleString()}만 원</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.maintenance}만 원</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">{item.term}</td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status.includes('정상화') ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px]">
                            {item.status}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[11px]">
                            {item.status}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/90 font-bold text-white border-t-2 border-slate-700">
                  <tr>
                    <td className="py-4 px-4">합계 (전층)</td>
                    <td className="py-4 px-4 text-slate-300">918평</td>
                    <td className="py-4 px-4 text-amber-400">9억 5,000만 원</td>
                    <td className="py-4 px-4 text-emerald-400">4,040만 원/월</td>
                    <td className="py-4 px-4 text-slate-300">1,010만 원/월</td>
                    <td colSpan={2} className="py-4 px-4 text-right text-xs text-slate-400 font-normal">
                      * 월 총 수입: 5,050만 원
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────── 4. KEY INVESTMENT POINTS ────────────────────── */}
      <section className="py-16 md:py-24 bg-slate-900/30 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-3 px-3 py-1">
              KEY INVESTMENT HIGHLIGHTS
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              왜 시장에 나오기 무섭게 주목받는 희소 매물인가?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              자산가들이 가장 선호하는 3가지 핵심 이유를 정리했습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1️⃣ 수성구청역 도보 1분 대로변</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                대구 최고 학군 중심지이자 메디컬 타운의 핵심 입지. 왕복 다차선 메인 대로변에 위치하여 365일 압도적인 간판 홍보 효과와 접근성을 자랑합니다.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2️⃣ 2019년 준신축 & 주차 25대</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                연면적 840평 규모의 수선 부담 없는 2019년 준신축 건물. 특히 범어동 학원/메디컬 상권에서 가장 희소한 <strong className="text-white">주차 25대 공간</strong>을 확보하였습니다.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3️⃣ '목적 방문형' 공실 ZERO 상권</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                유명 학원과 전문 병원은 인테리어 비용 및 고객 접근성 때문에 이전하지 않습니다. 장기 우량 임차인 중심으로 공실 스트레스 없는 안정적 자산입니다.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────── 5. PRIVATE LEAD GENERATION FORM ────────────────────── */}
      <section id="lead-form" className="py-16 md:py-24 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 mb-3 px-3 py-1">
                PRIVATE BRIEFING REQUEST
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                상세 투자 제안서 (PDF & 임대차 계약서) 신청
              </h2>
              <p className="text-slate-400 text-sm">
                본 매물은 보안상 전체 공개하지 않으며, 성함과 연락처를 남겨주시면 담당 중개사가 확인 후 프라이빗 제안서를 발송해 드립니다.
              </p>
            </div>

            {leadSubmitted ? (
              <div className="p-8 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">상세 브리핑 신청이 완료되었습니다!</h3>
                <p className="text-slate-300 text-sm">
                  입력해주신 연락처(<span className="text-emerald-400 font-semibold">{leadPhone}</span>)로 담당 중개사가 확인 후 제안서를 발송해 드리겠습니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">성함 / 법인명</Label>
                  <Input 
                    type="text" 
                    placeholder="예: 홍길동 (또는 OO자산운용)" 
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    required
                    className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:border-amber-400"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">연락처 (휴대폰 번호)</Label>
                  <Input 
                    type="tel" 
                    placeholder="010-0000-0000" 
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    required
                    className="h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:border-amber-400"
                  />
                </div>

                <Button type="submit" className="w-full h-13 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-amber-500/20">
                  <Download className="w-5 h-5 mr-2" />
                  프라이빗 상세 제안서 신청하기
                </Button>

                <p className="text-[11px] text-center text-slate-500">
                  🔒 개인정보는 범어동 매물 상세 안내 목적으로만 안전하게 사용됩니다.
                </p>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* ────────────────────── STANDALONE FOOTER (나우부동산 전용) ────────────────────── */}
      <footer className="border-t border-slate-800 py-10 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-slate-200 text-sm mb-1">나우공인중개사사무소 (대표: 신속중개 나우부동산)</p>
            <p>대구 수성구 범어동 160억 통빌딩 매매 전용 프라이빗 브리핑 웹사이트</p>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-sm mb-0.5">
              <a href="tel:010-9999-3399" className="hover:underline inline-flex items-center justify-end gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>유선 문의: 010-9999-3399</span>
              </a>
            </p>
            <p>상세 프라이빗 브리핑은 유선 또는 내방 시 서류 검토 가능합니다.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
