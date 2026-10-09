'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GeoCountryService } from '@/lib/geoCountryService';

function getOrCreateVisitorUuid(): string {
  if (typeof window === 'undefined') return '';
  try {
    let vid = localStorage.getItem('parkon_visitor_uuid_v1');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('parkon_visitor_uuid_v1', vid);
    }
    return vid;
  } catch {
    return '';
  }
}

function getUserContext() {
  let userRegion = '';
  let homeCourse = '';
  let userName = '일반 골퍼';
  let isKakaoUser = false;
  let kakaoId = '';
  let country = 'KR';

  if (typeof window !== 'undefined') {
    try {
      country = GeoCountryService.getDetectedCountry();

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
        if (homeCourseId.startsWith('jp-') || country === 'JP') {
          userRegion = '일본';
          homeCourse = '일본 공인 코스';
        } else if (homeCourseId.includes('gumi') || homeCourseId.includes('dongrak') || homeCourseId.includes('yangho') || homeCourseId.includes('jisan')) {
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

  return { userRegion, homeCourse, userName, isKakaoUser, kakaoId, country };
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid duplicate tracking in rapid re-renders
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Don't track admin page itself
    if (pathname?.startsWith('/admin')) return;

    const track = async () => {
      try {
        const visitorId = getOrCreateVisitorUuid();
        const ctx = getUserContext();

        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            path: pathname || '/',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            userRegion: ctx.userRegion,
            homeCourse: ctx.homeCourse,
            userName: ctx.userName,
            isKakaoUser: ctx.isKakaoUser,
            kakaoId: ctx.kakaoId,
            country: ctx.country,
          }),
        });
      } catch {
        // Silently fail without interrupting user experience
      }
    };

    // Small delay to ensure non-blocking page load
    const timer = setTimeout(track, 300);

    // Heartbeat every 30 seconds (TTL 90s on server)
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const visitorId = getOrCreateVisitorUuid();
      const ctx = getUserContext();

      fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'heartbeat',
          visitorId,
          path: pathname || '/',
          userRegion: ctx.userRegion,
          userName: ctx.userName,
          country: ctx.country,
        }),
      }).catch(() => {});
    }, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(heartbeatInterval);
    };
  }, [pathname]);

  return null;
}
