'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Users, Phone, MapPin, Sparkles, Send, Shield, Info, Calendar } from 'lucide-react';
import { ParkGolfClub } from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';

interface ClubJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: ParkGolfClub | null;
  onSuccess: (updatedClub: ParkGolfClub) => void;
  isJapanese?: boolean;
}

const JOIN_MESSAGE_CHIPS = [
  '즐겁게 라운드하고 싶습니다!',
  '정기 월례회 열심히 참석하겠습니다!',
  '부부가 함께 가입 희망합니다.',
  '타수 향상 및 친선 교류 원합니다.',
  '규칙과 매너를 잘 지키겠습니다!',
];

export function ClubJoinModal({
  isOpen,
  onClose,
  club,
  onSuccess,
  isJapanese = false,
}: ClubJoinModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form states
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantExperience, setApplicantExperience] = useState('INTERMEDIATE');
  const [message, setMessage] = useState('');

  // Prefill user name if available in localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const storedName =
        localStorage.getItem('parkon_user_name') ||
        localStorage.getItem('parkon_last_registered_member_name') ||
        '';
      if (storedName) {
        setApplicantName(storedName);
      }
      setMessage('클럽 회원 가입을 신청합니다. 정기 월례회 및 친선 라운드에 성실히 참여하겠습니다!');
    }
  }, [isOpen]);

  if (!isOpen || !club) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      alert('신청자 성명을 입력해 주세요.');
      return;
    }
    if (!applicantPhone.trim()) {
      alert('연락처(휴대전화번호)를 입력해 주세요.');
      return;
    }

    const expText =
      applicantExperience === 'BEGINNER'
        ? '[구력: 초급]'
        : applicantExperience === 'ADVANCED'
        ? '[구력: 상급]'
        : '[구력: 중급]';

    const fullMessage = `${expText} ${message.trim()}`;

    const success = ClubStorage.requestJoinClub(club.id, {
      name: applicantName.trim(),
      phone: applicantPhone.trim(),
      message: fullMessage,
    });

    if (success) {
      alert(
        `🎉 [${club.name}] 가입 신청서가 정상 접수되었습니다!\n\n총무님(${club.managerName} ${club.contactPhone || ''})께서 확인 후 연락 및 승인을 진행해 주십니다.`
      );
      const updated = ClubStorage.getClubById(club.id);
      if (updated) onSuccess(updated);
      onClose();
    } else {
      alert('가입 신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[65] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-600 flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              ✍️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight">
                  {club.name}
                </h2>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-black">
                  가입 신청서
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                {club.homeCourseName} · {club.region}
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

        {/* 본문 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold text-stone-800 flex-1">
          {/* 1. 클럽 모집 공고 요약 카드 */}
          <div className="bg-gradient-to-b from-emerald-50/70 via-white to-stone-50 rounded-2xl p-3.5 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>회원 {club.memberCount}명 활동 중</span>
              </span>

              {club.recruitStatus === 'RECRUITING' ? (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🟢 회원 모집중 {club.recruitQuota ? `(${club.recruitQuota}명 정원)` : ''}
                </span>
              ) : club.recruitStatus === 'ALWAYS' ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🌟 상시 회원 모집
                </span>
              ) : (
                <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🔒 정원 마감
                </span>
              )}

              {club.annualDuesAmount !== undefined && (
                <span className="text-xs font-black text-emerald-900">
                  연회비: {club.annualDuesAmount > 0 ? `${club.annualDuesAmount.toLocaleString()}원` : '무료'}
                </span>
              )}
            </div>

            {club.description && (
              <p className="text-xs text-stone-700 font-semibold leading-relaxed">
                {club.description}
              </p>
            )}

            {/* 모집 공고 요강 */}
            {club.recruitNotes && (
              <div className="bg-white rounded-xl p-2.5 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>[클럽 총무 모집 요강 및 활동 혜택]</span>
                </span>
                <p className="text-xs text-stone-800 font-medium whitespace-pre-line leading-relaxed">
                  {club.recruitNotes}
                </p>
              </div>
            )}

            {/* 총무 직통 전화 버튼 */}
            {club.contactPhone && (
              <a
                href={`tel:${club.contactPhone}`}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>총무님 직통 문의 전화 ({club.contactPhone}) 📞</span>
              </a>
            )}
          </div>

          {/* 2. 가입 신청서 작성 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <span className="font-black text-sm text-stone-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-700" />
                <span>가입 신청서 작성</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                작성 후 총무님께 즉시 접수됩니다
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  신청자 성명 *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  신청자 연락처 (전화번호) *
                </label>
                <input
                  type="text"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* 구력 선택 */}
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                파크골프 구력
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  { id: 'BEGINNER', label: '초급 (1년 미만)' },
                  { id: 'INTERMEDIATE', label: '중급 (1~3년)' },
                  { id: 'ADVANCED', label: '상급 (3년 이상)' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setApplicantExperience(tier.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                      applicantExperience === tier.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 가입 인사말 */}
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                가입 신청 인사말 & 자기소개
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {JOIN_MESSAGE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setMessage((prev) => (prev ? `${prev} ${chip}` : chip));
                    }}
                    className="text-[10px] bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-200 px-2 py-0.5 rounded-lg cursor-pointer transition font-bold"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="총무님 및 회원님들께 전하고 싶은 가입 인사말을 입력하세요."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white resize-none leading-relaxed"
              />
            </div>

            {/* 제출 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                id="club-join-submit-btn"
                className="w-full py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                <Check className="w-4 h-4 text-emerald-200" />
                <span>클럽 가입 신청서 접수하기 ✍️</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
