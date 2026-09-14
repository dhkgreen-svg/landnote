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
        let userRegion = '경북 구미';
        let homeCourse = '구미 동락 파크골프장';
        let userName = '일반 골퍼';

        if (typeof window !== 'undefined') {
          try {
            const profileRaw = localStorage.getItem('parkon_user_profile_v1');
            if (profileRaw) {
              const profile = JSON.parse(profileRaw);
              if (profile.userName) userName = profile.userName;
              if (profile.clubName?.includes('구미')) userRegion = '경북 구미';
              else if (profile.clubName?.includes('부산')) userRegion = '부산';
              else if (profile.clubName?.includes('서울') || profile.clubName?.includes('한강')) userRegion = '서울/수도권';
              else if (profile.clubName?.includes('대구')) userRegion = '대구';
            }

            const homeCourseId = localStorage.getItem('parkon_home_course_id_v1');
            if (homeCourseId) {
              if (homeCourseId.includes('gumi') || homeCourseId.includes('dongrak') || homeCourseId.includes('yangho') || homeCourseId.includes('jisan')) {
                userRegion = '경북 구미';
                homeCourse = '구미 동락/양호/지산 구장';
              } else if (homeCourseId.includes('daegu') || homeCourseId.includes('gangchang')) {
                userRegion = '대구';
                homeCourse = '대구 강창 구장';
              } else if (homeCourseId.includes('busan') || homeCourseId.includes('samrak')) {
                userRegion = '부산';
                homeCourse = '부산 삼락 구장';
              } else if (homeCourseId.includes('seoul') || homeCourseId.includes('yeouido')) {
                userRegion = '서울/수도권';
                homeCourse = '여의도 한강 구장';
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
