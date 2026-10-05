'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  ArrowRight,
  Heart,
  Award,
} from 'lucide-react';
import { ParkGolfClub } from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';
import { ParkOnStorage } from '@/lib/storage';
import { calculateTier, getUserCompleted9Holes } from '@/lib/courseBlockTier';
import { DiamondTierBadge } from '@/components/DiamondTierBadge';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function ClubJoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isJapanese } = useTranslation();

  const clubId = searchParams?.get('clubId') || searchParams?.get('id') || '';

  const [club, setClub] = useState<ParkGolfClub | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [applicantName, setApplicantName] = useState<string>('');
  const [memberCode, setMemberCode] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('즐겁고 매너 있는 파크골프 함께하겠습니다!');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [alreadyMember, setAlreadyMember] = useState<boolean>(false);
  const [alreadyPending, setAlreadyPending] = useState<boolean>(false);

  // 1. 초기 사용자 정보 자동 프리필 및 클럽 조회
  useEffect(() => {
    let name = '';
    let code = '';
    if (typeof window !== 'undefined') {
      name =
        localStorage.getItem('parkon_registered_name') ||
        ParkOnStorage.getUserDisplayName() ||
        '';
      if (
        name === '손오공' ||
        name === '홍길동' ||
        name === '플레이어' ||
        name === '파크골퍼' ||
        name === 'パークゴルファー'
      ) {
        name = '';
      }

      code =
        localStorage.getItem('parkon_member_code_v1') ||
        localStorage.getItem('parkon_member_code') ||
        '';
    }

    setApplicantName(name);
    setMemberCode(code);

    if (clubId) {
      const found = ClubStorage.getClubById(clubId);
      if (found) {
        setClub(found);
        checkStatus(found, name, code);
      } else {
        // Fallback to fetch from Supabase
        ClubStorage.fetchClubsFromSupabase().then((list) => {
          const remoteFound = list.find((c) => c.id === clubId);
          if (remoteFound) {
            setClub(remoteFound);
            checkStatus(remoteFound, name, code);
          }
          setLoading(false);
        });
        return;
      }
    }
    setLoading(false);
  }, [clubId]);

  const checkStatus = (targetClub: ParkGolfClub, name: string, code: string) => {
    if (!name && !code) return;
    const cleanName = name.trim();
    const cleanCode = code.trim();

    // 정회원 여부 체크
    const isMem = targetClub.members?.some(
      (m) =>
        (cleanName && m.name === cleanName) ||
        (cleanCode && m.memberCode === cleanCode)
    );
    if (isMem) {
      setAlreadyMember(true);
      return;
    }

    // 승인 대기 여부 체크
    const isPend = targetClub.pendingMembers?.some(
      (p) =>
        (cleanName && p.name === cleanName) ||
        (cleanCode && p.memberCode === cleanCode)
    );
    if (isPend) {
      setAlreadyPending(true);
    }
  };

  // 2. 초대형 녹색 버튼 원터치 가입 신청 핸들러
  const handle1TouchJoin = () => {
    if (!club) return;
    const finalName = applicantName.trim() || '동호회원';
    const finalCode = memberCode.trim() || `PKY-${Math.floor(1000 + Math.random() * 9000)}`;

    const success = ClubStorage.requestJoinClub(club.id, {
      name: finalName,
      memberCode: finalCode,
      phone: phone.trim(),
      message: message.trim(),
    });

    if (success) {
      setIsSubmitted(true);
      setAlreadyPending(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-stone-600">클럽 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 select-none">
        <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-center space-y-4 border border-stone-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-stone-900">클럽을 찾을 수 없습니다</h2>
          <p className="text-xs text-stone-500 font-medium">
            초대 링크의 클럽 주소가 만료되었거나 존재하지 않는 클럽입니다.
          </p>
          <Link
            href="/club"
            className="block w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-95"
          >
            클럽 목록으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const completed9H = getUserCompleted9Holes(applicantName);
  const tier = calculateTier(completed9H);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-start p-4 select-none pb-16">
      {/* Header Visual Hero */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-800/10 mb-4">
        <div className="bg-emerald-900 text-white p-6 text-center relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-700/30 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

          {/* 파키 마스코트 환영 깃발 */}
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/40 bg-emerald-800 mb-3">
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크골프 올인원 공식 마스코트 파키"
              fill
              className="object-cover"
              priority
            />
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
            <span>👑 공식 클럽 정회원 가입 초청장</span>
          </span>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
            {club.name}
          </h1>

          <div className="flex items-center gap-2 text-xs text-emerald-200 mt-1 flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{club.homeCourseName} ({club.region})</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>회원 {club.memberCount}명 활동 중</span>
            </span>
          </div>

          <p className="text-xs text-emerald-100/90 mt-2.5 max-w-xs leading-relaxed bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/50">
            &ldquo;{club.description || '정기 월례회와 매너 있는 파크골프 라운딩을 함께하는 명문 클럽입니다.'}&rdquo;
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* 이미 정회원인 경우 */}
          {alreadyMember ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm">
                🎖️
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950">
                  이미 {club.name}의 정회원입니다!
                </h3>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  클럽 홈에서 월례회 참가 및 회원 랭킹을 확인해 보세요.
                </p>
              </div>
              <Link
                href={`/club?clubId=${club.id}`}
                className="block w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md transition active:scale-95"
              >
                우리 클럽 홈으로 바로가기 ▶
              </Link>
            </div>
          ) : isSubmitted || alreadyPending ? (
            /* 가입 신청 완료 / 승인 대기 상태 */
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm animate-bounce">
                ⏳
              </div>
              <div>
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  승인 대기 중
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  가입 신청이 성공적으로 접수되었습니다!
                </h3>
                <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                  총무님({club.managerName || '김총무'})이 명부를 확인한 후 승인하면 정회원으로 등록됩니다.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/club"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 font-black text-xs rounded-xl shadow-md transition"
                >
                  클럽 목록 둘러보기
                </Link>
                <Link
                  href="/"
                  className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl transition"
                >
                  홈 화면으로 돌아가기
                </Link>
              </div>
            </div>
          ) : (
            /* 가입 신청 양식 (시니어 맞춤형 1-Touch) */
            <div className="space-y-4">
              {/* 신청자 프로필 카드 (자동 프리필) */}
              <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>👤 가입 신청자 정보</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                      자동 연동
                    </span>
                  </span>
                  {memberCode && (
                    <span className="text-[10px] font-black bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                      고유번호: {memberCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                      {applicantName ? applicantName.slice(0, 1) : '골'}
                    </div>
                    <div>
                      <div className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                        <span>{applicantName || '이름 미등록 (입력 필요)'}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        9홀 통산 {completed9H}회 완주
                      </div>
                    </div>
                  </div>

                  {/* 컬러 다이아몬드 티어 배지 */}
                  <DiamondTierBadge
                    tier={tier}
                    completedCount={completed9H}
                    size="sm"
                    showLabel={true}
                  />
                </div>

                {/* 이름이 없는 경우 직접 입력창 제공 */}
                {!applicantName && (
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      성명(실명)을 입력해 주세요:
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="예: 김대희"
                      className="w-full p-2.5 border-2 border-amber-400 rounded-xl text-sm font-black text-stone-900 focus:outline-emerald-600 bg-amber-50"
                    />
                  </div>
                )}
              </div>

              {/* 총무님 안내 및 연락처 */}
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-black text-emerald-950">
                    클럽 임원진 안내
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                    회장: {club.presidentName || '박회장'} · 총무: {club.managerName || '김총무'}
                  </div>
                </div>
                {club.contactPhone && (
                  <a
                    href={`tel:${club.contactPhone}`}
                    className="py-1.5 px-3 bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition"
                  >
                    📞 총무 문의
                  </a>
                )}
              </div>

              {/* 🔥 [대표님 특명 UX]: 초대형 녹색 단일 원터치 버튼 */}
              <button
                type="button"
                onClick={handle1TouchJoin}
                className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border-2 border-emerald-400 ring-4 ring-emerald-500/20"
              >
                <span>⛳</span>
                <span>[{club.name}] 가입 신청하기</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>

              <p className="text-[11px] text-center text-stone-500 font-medium">
                * 가입 신청 시 총무 스마트폰으로 알림이 전송되며, 승인 즉시 정회원으로 등록됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/club"
        className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>전국 클럽 목록으로 돌아가기</span>
      </Link>
    </div>
  );
}

export default function ClubJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <p className="text-xs font-black text-stone-600">클럽 페이지 불러오는 중...</p>
        </div>
      }
    >
      <ClubJoinContent />
    </Suspense>
  );
}
