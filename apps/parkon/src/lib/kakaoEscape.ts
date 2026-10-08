/**
 * 카카오톡 및 SNS 인앱 브라우저 탈출 및 정규 브라우저(크롬, 삼성인터넷, 사파리) 전환 엔진
 * ParkGolf All-in-One (파크골프 올인원) 공식 유틸리티
 */

export interface KakaoEscapeResult {
  escaped: boolean;
  platform: 'android' | 'ios' | 'other';
  method: string;
}

/**
 * 카카오톡 인앱 브라우저 여부 검사
 */
export function isKakaoTalkWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('kakaotalk');
}

/**
 * 라인(LINE) 인앱 브라우저 여부 검사
 */
export function isLineWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('line');
}

/**
 * 네이버(NAVER) 인앱 브라우저 여부 검사
 */
export function isNaverWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('naver');
}

/**
 * 광범위 인앱 브라우저(카카오톡, 라인, 네이버, 인스타그램, 페이스북 등) 여부 검사
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /kakaotalk|line|naver|daum|instagram|fb_iab|fb4a|fban|everytimeapp|snapchat|wv/i.test(ua);
}

/**
 * 안드로이드 단말 여부 검사
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(window.navigator.userAgent);
}

/**
 * iOS(아이폰, 아이패드) 단말 여부 검사
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

/**
 * 모바일 단말 여부 검사
 */
export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

/**
 * URL에서 프로토콜(http://, https://) 제거 후 깨끗한 주소 반환
 */
export function getCleanUrl(url?: string): string {
  const target = url || (typeof window !== 'undefined' ? window.location.href : 'https://www.parkgolfallinone.com');
  return target.replace(/^https?:\/\//i, '');
}

/**
 * 안드로이드 전용 크롬/삼성/기본 브라우저 인텐트 스킴 생성
 */
export function getAndroidIntentUrl(url?: string, browser: 'chrome' | 'samsung' | 'default' = 'chrome'): string {
  const cleanUrl = getCleanUrl(url);
  if (browser === 'chrome') {
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
  }
  if (browser === 'samsung') {
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.sec.android.app.sbrowser;end;`;
  }
  return `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;`;
}

/**
 * 카카오톡 내부 외부 브라우저 호출 공식 스킴 생성
 */
export function getKakaoExternalUrl(url?: string): string {
  const target = url || (typeof window !== 'undefined' ? window.location.href : 'https://www.parkgolfallinone.com');
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`;
}

/**
 * 라인(LINE) 인앱 브라우저 탈출 (?openExternalBrowser=1 스킴)
 */
export function escapeLineWebView(targetUrl?: string): KakaoEscapeResult {
  if (typeof window === 'undefined') {
    return { escaped: false, platform: 'other', method: 'none' };
  }
  const current = targetUrl || window.location.href;
  const separator = current.includes('?') ? '&' : '?';
  const externalUrl = current.includes('openExternalBrowser=1') ? current : `${current}${separator}openExternalBrowser=1`;
  window.location.href = externalUrl;
  return { escaped: true, platform: isIOS() ? 'ios' : 'android', method: 'line_open_external' };
}

/**
 * 카카오톡 또는 인앱 브라우저에서 바깥 정규 브라우저(크롬, 사파리)로 탈출 실행
 */
export function escapeKakaoTalk(targetUrl?: string): KakaoEscapeResult {
  if (typeof window === 'undefined') {
    return { escaped: false, platform: 'other', method: 'none' };
  }

  // 0. LINE 인앱 브라우저 감지 시
  if (isLineWebView()) {
    return escapeLineWebView(targetUrl);
  }

  const url = targetUrl || window.location.href;
  const clean = getCleanUrl(url);

  // 1. 안드로이드 단말: 크롬 인텐트 우선 호출 ➔ 기본 브라우저 fallback
  if (isAndroid()) {
    const chromeIntent = getAndroidIntentUrl(url, 'chrome');
    try {
      window.location.href = chromeIntent;
      return { escaped: true, platform: 'android', method: 'chrome_intent' };
    } catch {
      const defaultIntent = getAndroidIntentUrl(url, 'default');
      window.location.href = defaultIntent;
      return { escaped: true, platform: 'android', method: 'default_intent' };
    }
  }

  // 2. iOS(아이폰/아이패드) 단말: 카카오톡 openExternal 스킴 호출 ➔ 사파리 스킴 fallback
  if (isIOS()) {
    const kakaoExternal = getKakaoExternalUrl(url);
    try {
      window.location.href = kakaoExternal;
      // 사파리 다이렉트 스킴 fallback 타이머 (openExternal 미지원 버전 대비)
      setTimeout(() => {
        try {
          window.location.href = `x-safari-https://${clean}`;
        } catch {
          // fallback
        }
      }, 500);
      return { escaped: true, platform: 'ios', method: 'kakao_open_external' };
    } catch {
      window.location.href = `x-safari-https://${clean}`;
      return { escaped: true, platform: 'ios', method: 'x_safari_scheme' };
    }
  }

  // 3. 데스크톱 및 기타 환경: kakaotalk openExternal 스킴 시도
  try {
    window.location.href = getKakaoExternalUrl(url);
    return { escaped: true, platform: 'other', method: 'kakao_open_external' };
  } catch {
    return { escaped: false, platform: 'other', method: 'fallback' };
  }
}

/**
 * 카카오톡, 네이버, LINE 등 인앱 브라우저 접속 시 최초 1회 자동 외부 브라우저 탈출 시도
 */
export function autoEscapeInAppBrowser(targetUrl?: string): boolean {
  if (typeof window === 'undefined') return false;

  // PWA Standalone 모드로 이미 실행 중인 경우 탈출 불필요
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  if (isStandalone) return false;

  const isKakao = isKakaoTalkWebView();
  const isLine = isLineWebView();
  const isNaver = isNaverWebView();
  const inApp = isInAppBrowser();
  const android = isAndroid();
  const ios = isIOS();

  if (!inApp) return false;

  try {
    const alreadyEscaped = sessionStorage.getItem('parkon_inapp_auto_escaped');
    if (alreadyEscaped === 'true') {
      return false;
    }
    sessionStorage.setItem('parkon_inapp_auto_escaped', 'true');

    // 1. Android: 크롬 강제 실행 또는 기본 브라우저 인텐트 호출
    if (android) {
      const chromeIntent = getAndroidIntentUrl(targetUrl, 'chrome');
      window.location.href = chromeIntent;
      return true;
    }

    // 2. iOS: 카카오톡 openExternal 또는 라인 openExternalBrowser
    if (ios) {
      if (isKakao) {
        escapeKakaoTalk(targetUrl);
        return true;
      }
      if (isLine) {
        escapeLineWebView(targetUrl);
        return true;
      }
    }

    return false;
  } catch {
    // sessionStorage 비활성화 환경 대비
    return false;
  }
}

export const autoEscapeIfKakao = autoEscapeInAppBrowser;

/**
 * 현재 페이지 URL 클립보드 복사 헬퍼
 */
export async function copyCurrentUrl(customUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const target = customUrl || window.location.href;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(target);
      return true;
    }
  } catch {
    // clipboard API blocked fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = target;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
