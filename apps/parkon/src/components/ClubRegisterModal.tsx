'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Users, MapPin, Phone, Shield, Sparkles, Building, Info } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ParkGolfClub, ClubRecruitStatus } from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';

interface ClubRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: string;
  onSuccess: (newClub: ParkGolfClub) => void;
  isJapanese?: boolean;
}

const RECRUIT_PRESET_CHIPS = [
  '초보/여성/부부 동호인 대환영',
  '매월 2째주 정기 월례회 개최',
  '신규 가입 시 클럽 볼 2구 증정',
  '선배 회원의 1:1 자세 코칭 지원',
  '분기별 전국 친선대회 출전',
  '주말 오전 자유 번개 라운드 활성화',
];

export function ClubRegisterModal({
  isOpen,
  onClose,
  courses,
  initialCourseId,
  onSuccess,
  isJapanese = false,
}: ClubRegisterModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form States
  const [name, setName] = useState('');
  const [homeCourseId, setHomeCourseId] = useState('');
  const [homeCourseName, setHomeCourseName] = useState('');
  const [region, setRegion] = useState('');
  const [presidentName, setPresidentName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [recruitStatus, setRecruitStatus] = useState<ClubRecruitStatus>('RECRUITING');
  const [recruitQuota, setRecruitQuota] = useState<number>(10);
  const [annualDuesAmount, setAnnualDuesAmount] = useState<number>(50000);
  const [recruitNotes, setRecruitNotes] = useState('');

  // Initial bindings when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPresidentName('');
      setManagerName('');
      setContactPhone('');
      setDescription('');
      setRecruitStatus('RECRUITING');
      setRecruitQuota(10);
      setAnnualDuesAmount(50000);
      setRecruitNotes('초보 및 부부 동호인 환영! 매월 정기 월례회 및 친선 라운드를 함께할 신규 회원을 모집합니다.');

      if (initialCourseId) {
        const found = courses.find((c) => c.id === initialCourseId);
        if (found) {
          setHomeCourseId(found.id);
          setHomeCourseName(found.name);
          setRegion(found.region || '경북 구미');
        } else {
          setHomeCourseId(courses[0]?.id || 'course-default');
          setHomeCourseName(courses[0]?.name || '구미 동락 파크골프장');
          setRegion(courses[0]?.region || '경북 구미');
        }
      } else if (courses.length > 0) {
        setHomeCourseId(courses[0].id);
        setHomeCourseName(courses[0].name);
        setRegion(courses[0].region || '경북 구미');
      }
    }
  }, [isOpen, initialCourseId, courses]);

  if (!isOpen) return null;

  const handleCourseChange = (cId: string) => {
    setHomeCourseId(cId);
    const found = courses.find((c) => c.id === cId);
    if (found) {
      setHomeCourseName(found.name);
      if (found.region) setRegion(found.region);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('클럽 또는 동호회 명칭을 입력해 주세요.');
      return;
    }
    if (!homeCourseName.trim()) {
      alert('홈 구장을 선택해 주세요.');
      return;
    }
    if (!managerName.trim()) {
      alert('총무(운영자) 성명을 입력해 주세요.');
      return;
    }
    if (!contactPhone.trim()) {
      alert('회원 가입 및 문의 전화번호를 입력해 주세요.');
      return;
    }

    const created = ClubStorage.createClub({
      name: name.trim(),
      region: region.trim() || '전국',
      homeCourseId: homeCourseId || `course-custom-${Date.now()}`,
      homeCourseName: homeCourseName.trim(),
      description: description.trim() || `${name} 파크골프 클럽입니다. 회원 상호 간의 친목과 건강 증진을 도모합니다.`,
      presidentName: presidentName.trim() || '회장',
      managerName: managerName.trim(),
      contactPhone: contactPhone.trim(),
      isPublic: true,
      badgeColor: 'emerald',
      recruitStatus,
      recruitQuota: recruitQuota > 0 ? recruitQuota : undefined,
      recruitNotes: recruitNotes.trim(),
      annualDuesAmount: annualDuesAmount >= 0 ? annualDuesAmount : 50000,
    });

    alert(`🎉 [${created.name}] 클럽 등록 및 회원 모집 공고가 완료되었습니다!\n동호인들이 공고를 보고 가입 신청서를 접수할 수 있습니다.`);
    onSuccess(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-600 flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              👥
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight">
                  {isJapanese ? 'パークゴルフ クラブ・同好会 無料登録' : '파크골프 클럽 등록 & 회원 모집 공고'}
                </h2>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-black">
                  100% 무료
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                총무님! 우리 클럽을 등록하고 신규 동호인 회원을 모집하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold text-stone-800 flex-1">
          {/* 1. 클럽명 & 홈구장 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-stone-700">
              클럽 / 동호회 명칭 *
            </label>
            <input
              type="text"
              id="club-input-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 구미 동락 한마음 클럽, 수성 에이스 동호회"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* 홈 구장 선택 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>활동 홈 구장 *</span>
              </label>
              <select
                id="club-input-course"
                value={homeCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region || '전국'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                연고 지역 (시/도) *
              </label>
              <input
                type="text"
                id="club-input-region"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 경북 구미, 대구 수성, 경남 밀양"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 2. 임원진 & 총무 문의처 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                회장 성명
              </label>
              <input
                type="text"
                id="club-input-president"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                placeholder="예: 박회장"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                총무 성명 (운영자) *
              </label>
              <input
                type="text"
                id="club-input-manager"
                required
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="예: 김총무"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>가입 문의 전화번호 *</span>
              </label>
              <input
                type="text"
                id="club-input-phone"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. 클럽 소개 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-stone-700">
              클럽 소개글
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="클럽 창립 배경, 주요 활동 구장 및 모임 분위기를 자유롭게 소개해 주세요."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white resize-none leading-relaxed"
            />
          </div>

          {/* 4. 회원 모집 공고 설정 (핵심 기능) */}
          <div className="p-3.5 bg-emerald-50/70 border-2 border-emerald-400 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>회원(동호인) 모집 공고 설정</span>
              </span>
              <span className="text-[10px] bg-emerald-700 text-white font-black px-2 py-0.5 rounded-full">
                공고 게시 무료
              </span>
            </div>

            {/* 모집 상태 토글 */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {[
                { id: 'RECRUITING' as ClubRecruitStatus, label: '🟢 신규 모집중' },
                { id: 'ALWAYS' as ClubRecruitStatus, label: '🌟 상시 모집' },
                { id: 'CLOSED' as ClubRecruitStatus, label: '🔒 정원 마감' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRecruitStatus(item.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                    recruitStatus === item.id
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 모집 인원 및 연회비 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-stone-800 mb-1">
                  모집 인원 (정원)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    id="club-input-quota"
                    min={1}
                    max={200}
                    value={recruitQuota}
                    onChange={(e) => setRecruitQuota(Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                  <span className="text-xs font-bold text-stone-600 shrink-0">명 모집</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-800 mb-1">
                  클럽 연회비 (1년 기준)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    id="club-input-dues"
                    step={10000}
                    min={0}
                    value={annualDuesAmount}
                    onChange={(e) => setAnnualDuesAmount(Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                  <span className="text-xs font-bold text-stone-600 shrink-0">원 (0원=무료)</span>
                </div>
              </div>
            </div>

            {/* 모집 요강 및 특전 칩 */}
            <div>
              <label className="block text-[11px] font-black text-stone-800 mb-1">
                모집 요강 & 동호인 특전 (간편 선택)
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {RECRUIT_PRESET_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setRecruitNotes((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}`));
                    }}
                    className="text-[10px] bg-white hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-200 px-2 py-0.5 rounded-lg cursor-pointer transition font-bold shadow-2xs"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                id="club-input-notes"
                value={recruitNotes}
                onChange={(e) => setRecruitNotes(e.target.value)}
                placeholder="정기 월례회 날짜, 가입 조건, 활동 혜택 등 모집 공고를 상세히 적어주세요."
                className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 등록 완료 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              id="club-submit-register-btn"
              className="w-full py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              <Users className="w-4 h-4 text-emerald-200" />
              <span>클럽 등록 및 회원 모집 공고 올리기 (100% 무료)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
