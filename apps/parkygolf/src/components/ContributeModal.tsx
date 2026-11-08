'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';

interface ContributeModalProps {
  course: Course;
  onClose: () => void;
  onSaved: (updatedCourse: Course) => void;
}

export function ContributeModal({ course, onClose, onSaved }: ContributeModalProps) {
  const [contributorName, setContributorName] = useState(course.contributorName || '');
  const [description, setDescription] = useState(course.description || '');
  const [localRule, setLocalRule] = useState(course.holesMetadata[0]?.localRule || '');
  const [selectedHoles, setSelectedHoles] = useState<number>(course.totalHoles || 18);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim()) return;

    const coursesCount = Math.max(1, Math.round(selectedHoles / 9));
    const baseHoles = selectedHoles !== course.totalHoles ? generateStandardHoles(selectedHoles) : course.holesMetadata;
    const updatedHoles = baseHoles.map((h, i) => {
      if (i === 0 && localRule.trim()) {
        return { ...h, localRule: localRule.trim() };
      }
      return h;
    });

    const updatedCourse: Course = {
      ...course,
      totalCourses: coursesCount,
      totalHoles: selectedHoles,
      description: description.trim() || course.description,
      contributorName: contributorName.trim(),
      contributedAt: new Date().toISOString().split('T')[0],
      holesMetadata: updatedHoles,
    };

    ParkOnStorage.updateCourse(updatedCourse);
    setSavedSuccess(true);
    setTimeout(() => {
      onSaved(updatedCourse);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
              👑
            </span>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">
                구장 정보 기여 & 명예 등록
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {course.name} ({course.region})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-emerald-950">
              명예 기여가 등록되었습니다!
            </h4>
            <p className="text-sm font-bold text-stone-600">
              👑 <span className="text-emerald-700">{contributorName}</span> 님의 이름이 구장 정보에 영구 표기됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                파크골프 동호인 누구든지 구장의 최신 룰과 팁을 등록할 수 있습니다. 등록하신 분의 성함이나 닉네임이 구장 상단에 <strong>명예 뱃지(👑)</strong>로 수록됩니다.
              </span>
            </div>

            {/* Contributor Name */}
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1">
                기여자 이름 또는 클럽명 *
              </label>
              <input
                type="text"
                required
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="예: 구미사랑, 김파크, 수성클럽총무"
                className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>

            {/* Courses & Holes Selection */}
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1">
                코스 및 홀 수 정보 (수정 가능)
              </label>
              <select
                value={selectedHoles}
                onChange={(e) => setSelectedHoles(Number(e.target.value))}
                className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
              >
                <option value={9}>총 1코스 9홀</option>
                <option value={18}>총 2코스 18홀 (표준 일반)</option>
                <option value={27}>총 3코스 27홀</option>
                <option value={36}>총 4코스 36홀 (표준 대형)</option>
                <option value={45}>총 5코스 45홀 (밀양 아리랑형)</option>
                <option value={54}>총 6코스 54홀</option>
                <option value={63}>총 7코스 63홀 (구미 지산형)</option>
                <option value={72}>총 8코스 72홀 (창원 대산 / 지산 72홀 증설형)</option>
                <option value={108}>총 12코스 108홀 (의성 초대형)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1">
                구장 소개 및 특징 (잔디 상태, 예약 팁 등)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 낙동강변 천연잔디 구장으로 배수가 빠르고 오전 9시 전후가 가장 쾌적합니다."
                className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>

            {/* Local Rule */}
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1">
                주요 로컬룰 (선택)
              </label>
              <input
                type="text"
                value={localRule}
                onChange={(e) => setLocalRule(e.target.value)}
                placeholder="예: 3번 홀 우측 안전망 넘어가면 2벌타 OB 처리"
                className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-sm shadow-md active:scale-95 transition"
              >
                기여 등록하고 명예 뱃지 받기 👑
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                닫기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
