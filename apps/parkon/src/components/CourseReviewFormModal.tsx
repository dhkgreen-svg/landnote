'use client';

import React, { useState } from 'react';
import { X, Star, Camera, Check, Sparkles } from 'lucide-react';
import { Course } from '@/types/parkon';
import { CourseReview, CourseReviewStorage } from '@/lib/courseReviewStorage';

interface CourseReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: string | null;
  onSuccess: (newReview: CourseReview) => void;
}

const SAMPLE_REVIEW_PHOTOS = [
  { label: '푸른 잔디 뷰', url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=500&auto=format&fit=crop&q=80' },
  { label: '티샷 박스 전경', url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&auto=format&fit=crop&q=80' },
  { label: '클럽하우스 & 휴게소', url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=500&auto=format&fit=crop&q=80' },
];

export function CourseReviewFormModal({
  isOpen,
  onClose,
  courses,
  initialCourseId,
  onSuccess,
}: CourseReviewFormModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (initialCourseId && initialCourseId !== 'ALL') return initialCourseId;
    return courses[0]?.id || 'course-gumi-dongrak';
  });
  const [rating, setRating] = useState<number>(5);
  const [authorName, setAuthorName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SAMPLE_REVIEW_PHOTOS[0].url);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('구장에 대한 솔직한 생생 한줄평을 입력해 주세요.');
      return;
    }
    const foundCourse = courses.find((c) => c.id === selectedCourseId);
    const courseName = foundCourse?.name || '파크골프장';

    const newRev = CourseReviewStorage.addReview({
      courseId: selectedCourseId,
      courseName,
      rating,
      authorName: authorName.trim() || '익명의 파크골퍼',
      comment: comment.trim(),
      imageUrl: selectedPhoto || undefined,
    });

    alert('⭐ 생생 구장 탐방후기가 등록되었습니다! 동반 골퍼들과 공유됩니다.');
    onSuccess(newRev);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden my-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <h2 className="text-base font-black tracking-tight">생생 구장 탐방후기 작성</h2>
              <p className="text-[11px] text-emerald-100">5점 별점 + 사진 + 한줄평 무료 커뮤니티</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs font-bold text-stone-800">
          {/* 구장 선택 */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 mb-1">
              방문하신 구장 선택 *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
            >
              {courses.slice(0, 50).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.region || '전국'})
                </option>
              ))}
            </select>
          </div>

          {/* 5점 별점 선택 */}
          <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3 text-center space-y-1.5">
            <label className="block text-xs font-black text-amber-950">
              구장 만족도 별점 ({rating}점 / 5점)
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-stone-300 fill-stone-100'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 작성자 닉네임 */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 mb-1">
              작성자 닉네임 (선택)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="예: 구미홀인원, 대구버디"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
            />
          </div>

          {/* 생생 한줄평 */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 mb-1">
              생생 한줄평 후기 *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="잔디 상태, 휴게 시설, 주차 편의 등 방문 소감을 솔직하게 남겨주세요."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* 사진 선택 */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-emerald-700" />
              <span>현장 사진 첨부</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SAMPLE_REVIEW_PHOTOS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSelectedPhoto(p.url)}
                  className={`p-1 rounded-xl border text-center transition cursor-pointer relative ${
                    selectedPhoto === p.url
                      ? 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-50'
                      : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-12 object-cover rounded-lg mb-1" />
                  <span className="text-[9px] font-bold text-stone-700 truncate block">{p.label}</span>
                  {selectedPhoto === p.url && (
                    <span className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>생생 탐방후기 등록하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
