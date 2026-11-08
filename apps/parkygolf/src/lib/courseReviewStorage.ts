/**
 * ParkGolf All-in-One: Course Visit Reviews (구장 탐방후기) Storage
 * 무료 커뮤니티: 5점 별점 + 사진 + 생생 한줄평 간이 폼 연동
 */

export interface CourseReview {
  id: string;
  courseId: string;
  courseName: string;
  rating: number; // 1 ~ 5
  authorName: string;
  comment: string;
  imageUrl?: string;
  createdAt: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'parkon_course_reviews_v2';

// 100% 실제 골퍼 작성 생생 후기만 유지 (가짜 시드 후기 일체 배제)
const INITIAL_SEED_REVIEWS: CourseReview[] = [];

export const CourseReviewStorage = {
  getAllReviews(): CourseReview[] {
    if (typeof window === 'undefined') return INITIAL_SEED_REVIEWS;
    try {
      // 이전 버전 가짜 시드 후기 캐시 영구 소거
      try { localStorage.removeItem('parkon_course_reviews_v1'); } catch {}

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REVIEWS));
        return INITIAL_SEED_REVIEWS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 더미/가짜 후기 식별자 원천 차단
        const clean = parsed.filter((r: CourseReview) =>
          r &&
          r.id &&
          !['rev-1', 'rev-2', 'rev-3', 'rev-4'].includes(r.id)
        );
        if (clean.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REVIEWS));
      return INITIAL_SEED_REVIEWS;
    } catch {
      return INITIAL_SEED_REVIEWS;
    }
  },

  getReviewsForCourse(courseId?: string | null): CourseReview[] {
    const all = this.getAllReviews();
    if (!courseId || courseId === 'ALL') return all;
    return all.filter((r) =>
      r.courseId === courseId ||
      r.courseName.includes(courseId) ||
      courseId.includes(r.courseId)
    );
  },

  addReview(reviewData: Omit<CourseReview, 'id' | 'createdAt'>): CourseReview {
    const all = this.getAllReviews();
    const newRev: CourseReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newRev, ...all];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('parkon_reviews_updated', { detail: newRev }));
      } catch (e) {
        console.error('Failed to save review:', e);
      }
    }
    return newRev;
  },
};
