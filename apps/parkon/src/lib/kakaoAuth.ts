import { ParkOnStorage, KakaoAuthUser } from './storage';

declare global {
  interface Window {
    Kakao?: any;
  }
}

export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '';

export function initKakaoSDK(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.Kakao) return false;

  if (!window.Kakao.isInitialized() && KAKAO_JS_KEY) {
    try {
      window.Kakao.init(KAKAO_JS_KEY);
      return window.Kakao.isInitialized();
    } catch (e) {
      console.error('Kakao SDK Init Error:', e);
      return false;
    }
  }

  return window.Kakao.isInitialized();
}

/**
 * 카카오 1초 로그인 실행
 * 1. 실서비스 키가 등록되어 있으면: 카카오 공식 SDK 로그인 팝업 호출
 * 2. 개발/테스트 환경(키 미등록): 시뮬레이션 로그인 정보 생성
 */
export async function loginWithKakao(data?: {
  realName?: string;
  aliasName?: string;
  preferredDisplay?: 'REAL' | 'ALIAS';
  nickname?: string;
}): Promise<KakaoAuthUser> {
  const isSDKReady = initKakaoSDK();

  const realName = data?.realName?.trim() || '김대희';
  const aliasName = data?.aliasName?.trim() || '나이스버디';
  const preferredDisplay = data?.preferredDisplay || 'REAL';
  const effectiveNickname =
    (preferredDisplay === 'ALIAS' ? aliasName : realName) || realName || aliasName;

  if (isSDKReady && window.Kakao && window.Kakao.Auth) {
    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: (authObj: any) => {
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (res: any) => {
              const kakaoAccount = res.kakao_account;
              const profile = kakaoAccount?.profile;
              const user: KakaoAuthUser = {
                id: String(res.id),
                nickname: effectiveNickname || profile?.nickname || '파크골퍼',
                realName: realName,
                aliasName: aliasName,
                preferredDisplay: preferredDisplay,
                clubAliases: {},
                profileImageUrl: profile?.profile_image_url || profile?.thumbnail_image_url || '',
                email: kakaoAccount?.email || '',
                connectedAt: new Date().toISOString(),
              };
              ParkOnStorage.setKakaoUser(user);
              resolve(user);
            },
            fail: (error: any) => {
              console.error('Kakao API error:', error);
              reject(error);
            },
          });
        },
        fail: (err: any) => {
          console.error('Kakao Auth login fail:', err);
          reject(err);
        },
      });
    });
  }

  // 데모/간편 연동 모드 (실제 키 발급 전 또는 오프라인 환경 즉시 동작)
  const mockUser: KakaoAuthUser = {
    id: `kakao_${Date.now()}`,
    nickname: effectiveNickname,
    realName: realName,
    aliasName: aliasName,
    preferredDisplay: preferredDisplay,
    clubAliases: {},
    profileImageUrl: '',
    connectedAt: new Date().toISOString(),
  };

  ParkOnStorage.setKakaoUser(mockUser);
  return mockUser;
}

/**
 * 카카오 연동 해제 (로그아웃)
 */
export function logoutKakao(): void {
  if (typeof window !== 'undefined' && window.Kakao?.Auth?.getAccessToken()) {
    try {
      window.Kakao.Auth.logout(() => {});
    } catch {
      // ignore
    }
  }
  ParkOnStorage.setKakaoUser(null);
}
