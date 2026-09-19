'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid duplicate tracking in development or rapid re-renders
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Don't track admin page itself
    if (pathname?.startsWith('/admin')) return;

    const track = async () => {
      try {
        let userRegion = '';
        let homeCourse = '';
        let userName = '일반 골퍼';
        let isKakaoUser = false;
        let kakaoId = '';

        if (typeof window !== 'undefined') {
          try {
            // 1. GPS 위치 우선 확인
            const gpsRaw = localStorage.getItem('parkon_user_gps_v1');
            if (gpsRaw) {
              const gps = JSON.parse(gpsRaw);
              if (gps.regionName) {
                userRegion = gps.regionName;
                homeCourse = `${gps.regionName} 인근 구장`;
              }
            }

            // 2. 프로필 정보 확인
            const profileRaw = localStorage.getItem('parkon_user_profile_v1');
            if (profileRaw) {
              const profile = JSON.parse(profileRaw);
              if (profile.userName) userName = profile.userName;
              if (profile.region) userRegion = profile.region;
              else if (profile.clubName) {
                ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].forEach((r) => {
                  if (profile.clubName.includes(r)) userRegion = r;
                });
              }
            }

            // 3. 홈 구장 설정 확인
            const homeCourseId = localStorage.getItem('parkon_home_course_id_v1');
            if (homeCourseId && !userRegion) {
              if (homeCourseId.includes('gumi') || homeCourseId.includes('dongrak') || homeCourseId.includes('yangho') || homeCourseId.includes('jisan')) {
                userRegion = '경북 구미';
                homeCourse = '구미 동락/양호/지산 구장';
              } else if (homeCourseId.includes('daegu') || homeCourseId.includes('gangchang') || homeCourseId.includes('suseong')) {
                userRegion = '대구';
                homeCourse = '대구 수성/강창 구장';
              } else if (homeCourseId.includes('busan') || homeCourseId.includes('samrak')) {
                userRegion = '부산';
                homeCourse = '부산 삼락 구장';
              } else if (homeCourseId.includes('seoul') || homeCourseId.includes('yeouido')) {
                userRegion = '서울';
                homeCourse = '여의도 한강 구장';
              } else if (homeCourseId.includes('yangpyeong')) {
                userRegion = '경기 양평';
                homeCourse = '양평 강상 구장';
              }
            }

            // 4. 카카오 로그인 정보 확인
            const kakaoRaw = localStorage.getItem('parkon_kakao_user_v1');
            if (kakaoRaw) {
              const kakao = JSON.parse(kakaoRaw);
              if (kakao && (kakao.id || kakao.nickname)) {
                isKakaoUser = true;
                kakaoId = String(kakao.id || '');
                if (!userName || userName === '일반 골퍼') {
                  userName = kakao.realName || kakao.aliasName || kakao.nickname || userName;
                }
              }
            }
          } catch {
            // Ignore localStorage read errors
          }
        }

        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname || '/',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            userRegion,
            homeCourse,
            userName,
            isKakaoUser,
            kakaoId,
          }),
        });
      } catch (e) {
        // Silently fail without interrupting user experience
      }
    };

    // Small delay to ensure non-blocking page load
    const timer = setTimeout(track, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
