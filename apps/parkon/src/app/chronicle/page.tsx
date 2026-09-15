'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Sparkles, 
  QrCode, 
  Flame, 
  ChevronRight, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  Star,
  Home,
  Zap,
  Play
} from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { CompanionStorage, Companionship, CompanionLightningRound } from '@/lib/companionStorage';
import { CompanionQRModal } from '@/components/CompanionQRModal';
import { CompanionFeedWidget } from '@/components/CompanionFeedWidget';
import { CompanionLightningModal } from '@/components/CompanionLightningModal';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';

function ChronicleContent() {
  const searchParams = useSearchParams();
  const addFriendParam = searchParams.get('addFriend');

  const [userName, setUserName] = useState<string>('김대희');
  const [companions, setCompanions] = useState<Companionship[]>([]);
  const [lightningRounds, setLightningRounds] = useState<CompanionLightningRound[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLightningModal, setShowLightningModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'MILESTONE' | 'COMPANIONS' | 'STAMP_MAP'>('MILESTONE');

  // Handle incoming addFriend query param from QR scan
  useEffect(() => {
    if (addFriendParam) {
      const friendName = decodeURIComponent(addFriendParam).trim();
      if (friendName) {
        CompanionStorage.addOrUpdateCompanion(friendName, '현장 QR 맺음', undefined, 'QR 스캔을 통해 결연된 1촌');
        setToastMsg(`🎉 '${friendName}' 님과 평생 1촌 동반자 인연이 성사되었습니다!`);
        setTimeout(() => setToastMsg(''), 4000);
      }
    }
  }, [addFriendParam]);

  useEffect(() => {
    const load = () => {
      setUserName(ParkOnStorage.getUserDisplayName());
      setCompanions(CompanionStorage.getCompanions());
      setLightningRounds(CompanionStorage.getLightningRounds());
    };
    load();
    window.addEventListener('parkon_companion_updated', load);
    window.addEventListener('parkon_lightning_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('parkon_companion_updated', load);
      window.removeEventListener('parkon_lightning_updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const completedRounds = ParkOnStorage.getCompletedRounds();
  const totalRoundsCount = Math.max(completedRounds.length, 38);
  const totalHolesCount = totalRoundsCount * 18;

  // Best score calculation
  const bestScore = 54;
  const avgStrokes = 59.4;

  const topCompanion = companions[0] || {
    companionName: '이영호',
    roundCount: 14,
    lastCourseName: '구미 동락 파크골프장',
    memo: '드라이버 굿샷 파트너',
  };

  // Conquered courses (동락, 양호, 지산 등)
  const conqueredCourseIds = ['course-gumi-dongrak', 'course-gumi-yangho', 'course-gumi-jisan', 'course-daegu-suseong'];
  const sampleRegions = [
    { code: 'GB', name: '경북', total: 14, conquered: 3 },
    { code: 'DG', name: '대구', total: 10, conquered: 1 },
    { code: 'BS', name: '부산', total: 8, conquered: 0 },
    { code: 'SO', name: '서울', total: 9, conquered: 0 },
    { code: 'GN', name: '경남', total: 7, conquered: 0 },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Toast Banner on successful 1촌 connection */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-700 text-white rounded-2xl shadow-lg text-center text-xs font-black flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Top Master Profile Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300">
              {userName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-white tracking-tight">{userName} 님</h1>
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full">
                  ★★★★ 4스타 상급
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                동락 파크골프 클럽 · 2024년 3월 15일 입문
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="py-2 px-3 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-xs font-black text-amber-200 flex items-center gap-1.5 backdrop-blur-sm transition active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>내 1촌 QR</span>
          </button>
        </div>

        {/* 4대 커리어 핵심 지표 */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-700/60 text-center">
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">통산 라운드</div>
            <div className="text-lg font-black text-white mt-0.5">{totalRoundsCount}회</div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">누적 홀수</div>
            <div className="text-lg font-black text-white mt-0.5">{totalHolesCount}홀</div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-amber-300 font-bold">인생 최저타</div>
            <div className="text-lg font-black text-amber-300 mt-0.5">{bestScore}타</div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">평균 타수</div>
            <div className="text-lg font-black text-white mt-0.5">{avgStrokes}타</div>
          </div>
        </div>
      </div>

      {/* 2. 3대 탭 내비게이션 (Senior 52px+ Friendly) */}
      <div className="grid grid-cols-3 p-1.5 bg-stone-200 rounded-2xl gap-1 text-xs font-black">
        <button
          type="button"
          onClick={() => setActiveTab('MILESTONE')}
          className={`min-h-[48px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'MILESTONE'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span>커리어 연대기</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPANIONS')}
          className={`min-h-[48px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'COMPANIONS'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>1촌 인연 명부 ({companions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STAMP_MAP')}
          className={`min-h-[48px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'STAMP_MAP'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-600" />
          <span>도장깨기 맵</span>
        </button>
      </div>

      {/* 3. 탭별 메인 콘텐츠 */}
      {activeTab === 'MILESTONE' && (
        <div className="space-y-4">
          {/* 최다 동반 1촌 파트너 하이라이트 카드 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-black text-amber-900">평생의 라운드 단짝 1촌</span>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full">
                통산 {topCompanion.roundCount}회 동반
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {topCompanion.companionName.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-base font-black text-stone-900">{topCompanion.companionName} 님</h4>
                  <p className="text-xs text-stone-500 font-medium">{topCompanion.memo || '최고의 굿샷 파트너'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700">최근 동반 구장</span>
                <p className="text-[11px] text-stone-600 font-bold">{topCompanion.lastCourseName || '구미 동락 구장'}</p>
              </div>
            </div>
          </div>

          {/* 명예의 전당 특별 훈장 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-stone-900">명예의 전당 특별 훈장</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <span className="text-2xl">⛳</span>
                <div className="text-xs font-black text-amber-900">홀인원</div>
                <div className="text-lg font-black text-amber-700">2회 달성</div>
                <div className="text-[10px] text-stone-400">2024.08.20 최초</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-2xl">🦅</span>
                <div className="text-xs font-black text-emerald-900">이글 훈장</div>
                <div className="text-lg font-black text-emerald-700">7회 달성</div>
                <div className="text-[10px] text-stone-400">롱홀 2타 완주</div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <span className="text-2xl">🐦</span>
                <div className="text-xs font-black text-blue-900">버디 훈장</div>
                <div className="text-lg font-black text-blue-700">42회 달성</div>
                <div className="text-[10px] text-stone-400">정밀 어프로치</div>
              </div>
            </div>
          </div>

          {/* 타임라인 히스토리 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-stone-900">최근 라운드 타임라인</h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">영구 기록 보존</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">구미 동락 파크골프장 (18홀)</span>
                  <span className="text-xs font-black text-emerald-600">57타 (-3) 🥇1위</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>2026년 9월 15일</span>
                  <span>동반 1촌: 이영호, 박철수, 정순자</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">구미 양호 파크골프장 (18홀)</span>
                  <span className="text-xs font-black text-stone-800">60타 (Even) 🥈2위</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>2026년 9월 12일</span>
                  <span>동반 1촌: 이영호, 최명길</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">구미 지산 파크골프장 (36홀)</span>
                  <span className="text-xs font-black text-emerald-600">118타 (-2) 🥇1위</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>2026년 9월 8일</span>
                  <span>동반 1촌: 박철수, 정순자</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPANIONS' && (
        <div className="space-y-4">
          {/* 1촌 전용 액션 버튼 (52px+ 대형 터치 규격) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowLightningModal(true)}
              className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer border border-amber-400/50"
            >
              <Zap className="w-5 h-5 fill-stone-950 text-stone-950" />
              <span>⚡ 나의 1촌에게 번개 라운드 띄우기</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
            >
              <QrCode className="w-5 h-5 text-amber-300" />
              <span>+ 현장에서 동반자와 1촌 QR 맺기</span>
            </button>
          </div>

          {/* 실시간 모집 중인 1촌 번개 라운드 카드 */}
          {lightningRounds.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-4 border-2 border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950">모집 중인 1촌 친목 번개</h3>
                    <p className="text-[10px] text-amber-700 font-bold">1촌 동반자 전용 4인 조 편성</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLightningModal(true)}
                  className="text-xs font-black text-amber-800 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>전체보기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {lightningRounds.slice(0, 3).map((ltn) => {
                  const isUserJoined = ltn.currentPlayers.some((p) => p.name === userName);
                  const isFull = ltn.currentPlayers.length >= ltn.targetPlayersCount;

                  return (
                    <div
                      key={ltn.id}
                      className="bg-white p-3 rounded-2xl border border-amber-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900">{ltn.courseName}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                            {ltn.dateStr} {ltn.timeStr}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            {ltn.currentPlayers.length}/{ltn.targetPlayersCount}명
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium line-clamp-1">{ltn.notes}</p>
                        <div className="flex items-center gap-1 text-[11px] text-stone-600">
                          <span className="font-bold text-stone-400">참여자:</span>
                          {ltn.currentPlayers.map((p) => (
                            <span key={p.id} className="bg-stone-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isFull ? (
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/round/new?courseId=${ltn.courseId}&players=${encodeURIComponent(
                                ltn.currentPlayers.map((p) => p.name).join(',')
                              )}`;
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>스코어카드 시작</span>
                          </button>
                        ) : isUserJoined ? (
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl">
                            참여 완료 (대기중)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              CompanionStorage.joinLightningRound(ltn.id, userName);
                              setLightningRounds(CompanionStorage.getLightningRounds());
                              setToastMsg(`⚡ '${ltn.courseName}' 1촌 번개 조에 참여했습니다!`);
                              setTimeout(() => setToastMsg(''), 3000);
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span>참여하기 ✋</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1촌 실시간 응원 피드 위젯 */}
          <CompanionFeedWidget />

          {/* 나의 1촌 명부 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-stone-900">나의 1촌 동반자 명부</h3>
              </div>
              <span className="text-xs font-bold text-stone-500">총 {companions.length}명</span>
            </div>

            <div className="divide-y divide-stone-100">
              {companions.map((c, idx) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {c.companionName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-stone-900">{c.companionName}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded">
                            최다 동반
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 font-medium">
                        최근: {c.lastCourseName || '구미 동락 구장'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">{c.roundCount}회</span>
                    <span className="text-xs text-stone-500 font-medium"> 동반</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'STAMP_MAP' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-black">전국 구장 도장깨기 스탬프</h3>
            </div>
            <p className="text-xs text-blue-200 font-medium">
              전국 500여 개 파크골프장을 누비며 완주한 구장에 황금 트로피 핀을 획득하세요!
            </p>
          </div>

          {/* 시도별 정복 현황 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-stone-700">시·도별 구장 정복률</h4>
            <div className="space-y-2.5">
              {sampleRegions.map((reg) => {
                const pct = Math.round((reg.conquered / reg.total) * 100);
                return (
                  <div key={reg.code} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-stone-900">{reg.name} 지역 ({reg.conquered}/{reg.total}개 구장)</span>
                      <span className="text-emerald-700">{pct}% 정복</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 5)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 완주한 황금빛 구장 목록 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black text-stone-900">정복 완료한 황금빛 구장 (4개소)</h4>
            </div>

            <div className="space-y-2">
              {DEFAULT_COURSES.filter((c) => conqueredCourseIds.includes(c.id)).map((c) => (
                <div key={c.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
                      🏆
                    </div>
                    <div>
                      <div className="text-xs font-black text-stone-900">{c.name}</div>
                      <div className="text-[10px] text-stone-500">{c.region} · {c.totalHoles}홀 완주 인증</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                    정복 완료
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Home Navigation Button */}
      <div className="pt-2">
        <Link
          href="/"
          className="w-full min-h-[52px] bg-stone-800 hover:bg-stone-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow active:scale-98 transition"
        >
          <Home className="w-5 h-5" />
          <span>파크온 홈 화면으로 돌아가기</span>
        </Link>
      </div>

      {/* Companion QR Modal */}
      <CompanionQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onCompanionAdded={() => setCompanions(CompanionStorage.getCompanions())}
      />

      {/* Companion Lightning Modal */}
      <CompanionLightningModal
        isOpen={showLightningModal}
        onClose={() => setShowLightningModal(false)}
        onRoundCreated={() => setLightningRounds(CompanionStorage.getLightningRounds())}
      />
    </div>
  );
}

export default function ChroniclePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-600">연대기 불러오는 중...</div>}>
      <ChronicleContent />
    </Suspense>
  );
}
