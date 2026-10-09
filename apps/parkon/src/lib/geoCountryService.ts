'use client';

/**
 * 🌐 ParkOn / Parky GPS & Geo-Country Service
 * 위치 기반 국가 자동 감지, 다국어(ko/ja/en) 매칭 및 구장 DB 거리 연동 모듈
 */

export type ServiceCountry = 'KR' | 'JP' | 'GLOBAL';
export type ServiceLanguage = 'ko' | 'ja' | 'en';

export interface GeoLocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface MockLocationPreset {
  id: 'KR_GUMI' | 'JP_SAPPORO' | 'JP_TOKYO' | 'GLOBAL_US';
  name: string;
  nameJa: string;
  nameEn: string;
  lat: number;
  lng: number;
  country: ServiceCountry;
  defaultLang: ServiceLanguage;
}

export const MOCK_LOCATION_PRESETS: Record<string, MockLocationPreset> = {
  KR_GUMI: {
    id: 'KR_GUMI',
    name: '한국 (경북 구미 동락)',
    nameJa: '韓国 (慶尚北道 亀尾 同楽)',
    nameEn: 'Korea (Gumi Dongrak)',
    lat: 36.1195,
    lng: 128.3446,
    country: 'KR',
    defaultLang: 'ko',
  },
  JP_SAPPORO: {
    id: 'JP_SAPPORO',
    name: '일본 (홋카이도 삿포로)',
    nameJa: '日本 (北海道 札幌)',
    nameEn: 'Japan (Hokkaido Sapporo)',
    lat: 43.0618,
    lng: 141.3545,
    country: 'JP',
    defaultLang: 'ja',
  },
  JP_TOKYO: {
    id: 'JP_TOKYO',
    name: '일본 (도쿄/관동)',
    nameJa: '日本 (東京/関東)',
    nameEn: 'Japan (Tokyo/Kanto)',
    lat: 35.6762,
    lng: 139.6503,
    country: 'JP',
    defaultLang: 'ja',
  },
  GLOBAL_US: {
    id: 'GLOBAL_US',
    name: '미국/해외 (캘리포니아)',
    nameJa: '米国/グローバル (カリフォルニア)',
    nameEn: 'Global / USA (California)',
    lat: 37.7749,
    lng: -122.4194,
    country: 'GLOBAL',
    defaultLang: 'en',
  },
};

const STORAGE_KEYS = {
  USER_OVERRIDE_COUNTRY: 'parky_user_selected_country',
  USER_OVERRIDE_LANG: 'parky_lang',
  MOCK_LOCATION: 'parky_mock_location',
  CACHED_GEO: 'parky_cached_geo',
  SERVICE_COUNTRY: 'parkon_service_country_v1',
};

/**
 * 1. 위경도 바운딩 박스(Bounding Box) 기반 국가 판별
 * - 대한민국 (KR): 위도 약 33.0 ~ 38.6 / 경도 약 124.6 ~ 131.9
 * - 일본 (JP): 위도 약 24.0 ~ 45.6 / 경도 약 122.9 ~ 153.0
 * - 그 외: 글로벌 (GLOBAL)
 */
export function determineCountryFromCoords(lat: number, lng: number): ServiceCountry {
  // 1. 한국 바운딩 박스
  if (lat >= 33.0 && lat <= 38.6 && lng >= 124.6 && lng <= 131.9) {
    return 'KR';
  }
  // 2. 일본 바운딩 박스
  if (lat >= 24.0 && lat <= 45.6 && lng >= 122.9 && lng <= 153.0) {
    return 'JP';
  }
  return 'GLOBAL';
}

/**
 * 2. 시스템 언어 Fallback 기반 국가 판별
 */
export function determineCountryFromBrowserLang(): { country: ServiceCountry; lang: ServiceLanguage } {
  if (typeof navigator === 'undefined') {
    return { country: 'KR', lang: 'ko' };
  }
  const browserLang = (navigator.language || '').toLowerCase();
  if (browserLang.startsWith('ko')) {
    return { country: 'KR', lang: 'ko' };
  }
  if (browserLang.startsWith('ja')) {
    return { country: 'JP', lang: 'ja' };
  }
  return { country: 'GLOBAL', lang: 'en' };
}

/**
 * 3. 두 위경도 좌표 간 거리 계산 (단위: 미터) - Haversine 공식
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반경 (m)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeoCountryResult {
  country: ServiceCountry;
  language: ServiceLanguage;
  coords: GeoLocationCoords | null;
  source: 'MANUAL_USER' | 'MOCK_GPS' | 'REAL_GPS' | 'BROWSER_FALLBACK';
  mockPresetId?: string;
  locationName?: string;
}

export const GeoCountryService = {
  /**
   * 모의 GPS 위치 조회
   */
  getMockLocation(): MockLocationPreset | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOCK_LOCATION);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  /**
   * 모의 GPS 위치 설정
   */
  setMockLocation(presetKey: keyof typeof MOCK_LOCATION_PRESETS | 'CLEAR'): GeoCountryResult {
    if (typeof window === 'undefined') {
      return { country: 'KR', language: 'ko', coords: null, source: 'BROWSER_FALLBACK' };
    }

    if (presetKey === 'CLEAR') {
      localStorage.removeItem(STORAGE_KEYS.MOCK_LOCATION);
    } else {
      const preset = MOCK_LOCATION_PRESETS[presetKey];
      if (preset) {
        localStorage.setItem(STORAGE_KEYS.MOCK_LOCATION, JSON.stringify(preset));
        // 모의 위치 설정 시 해당 국가 서비스 및 언어도 자동 매핑
        localStorage.setItem(STORAGE_KEYS.SERVICE_COUNTRY, preset.country === 'JP' ? 'JP' : 'KR');
        localStorage.setItem(STORAGE_KEYS.USER_OVERRIDE_LANG, preset.defaultLang);
      }
    }

    const current = this.getCurrentState();
    this.broadcastChange(current);
    return current;
  },

  /**
   * 사용자 수동 국가/언어 변경 (상단 헤더 토글 등에서 호출)
   */
  setManualCountryAndLanguage(country: ServiceCountry, lang: ServiceLanguage): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_OVERRIDE_COUNTRY, country);
    localStorage.setItem(STORAGE_KEYS.USER_OVERRIDE_LANG, lang);
    localStorage.setItem('parkon_language', lang);
    localStorage.setItem(STORAGE_KEYS.SERVICE_COUNTRY, country === 'JP' ? 'JP' : 'KR');

    const result = this.getCurrentState();
    this.broadcastChange(result);
  },

  /**
   * 현재 상태(동기식) 즉시 조회
   */
  getCurrentState(): GeoCountryResult {
    if (typeof window === 'undefined') {
      return { country: 'KR', language: 'ko', coords: null, source: 'BROWSER_FALLBACK' };
    }

    // 1순위: 활성화된 모의 GPS (개발/테스트)
    const mock = this.getMockLocation();
    if (mock) {
      return {
        country: mock.country,
        language: mock.defaultLang,
        coords: { lat: mock.lat, lng: mock.lng },
        source: 'MOCK_GPS',
        mockPresetId: mock.id,
        locationName: mock.name,
      };
    }

    // 2순위: 사용자가 직접 상단에서 선택한 국가/언어
    const userCountry = localStorage.getItem(STORAGE_KEYS.USER_OVERRIDE_COUNTRY) as ServiceCountry;
    const userLang = localStorage.getItem(STORAGE_KEYS.USER_OVERRIDE_LANG) as ServiceLanguage;
    if (userCountry && userLang) {
      return {
        country: userCountry,
        language: userLang,
        coords: null,
        source: 'MANUAL_USER',
      };
    }

    // 3순위: 캐시된 GPS
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_GEO);
      if (cached) {
        const parsed = JSON.parse(cached);
        const country = determineCountryFromCoords(parsed.lat, parsed.lng);
        const defaultLang: ServiceLanguage = country === 'JP' ? 'ja' : country === 'KR' ? 'ko' : 'en';
        return {
          country,
          language: defaultLang,
          coords: { lat: parsed.lat, lng: parsed.lng },
          source: 'REAL_GPS',
        };
      }
    } catch {}

    // 4순위: 브라우저 언어 기반 Fallback
    const fallback = determineCountryFromBrowserLang();
    return {
      country: fallback.country,
      language: fallback.lang,
      coords: null,
      source: 'BROWSER_FALLBACK',
    };
  },

  getCurrentCoords(): GeoLocationCoords | null {
    return this.getCurrentState().coords;
  },

  getDetectedCountry(): ServiceCountry {
    return this.getCurrentState().country;
  },

  calculateDistanceMeters: calculateDistanceMeters,

  /**
   * 실시간 GPS 측정 및 국가/언어 자동 감지 파이프라인
   */
  async detectLocationAndCountry(): Promise<GeoCountryResult> {
    if (typeof window === 'undefined') {
      return { country: 'KR', language: 'ko', coords: null, source: 'BROWSER_FALLBACK' };
    }

    // 모의 GPS 우선
    const mock = this.getMockLocation();
    if (mock) {
      const res: GeoCountryResult = {
        country: mock.country,
        language: mock.defaultLang,
        coords: { lat: mock.lat, lng: mock.lng },
        source: 'MOCK_GPS',
        mockPresetId: mock.id,
        locationName: mock.name,
      };
      this.broadcastChange(res);
      return res;
    }

    // 사용자 수동 선택이 있다면 국가/언어는 고정하되 GPS 좌표만 업데이트
    const manualCountry = localStorage.getItem(STORAGE_KEYS.USER_OVERRIDE_COUNTRY) as ServiceCountry;
    const manualLang = localStorage.getItem(STORAGE_KEYS.USER_OVERRIDE_LANG) as ServiceLanguage;

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const fallback = determineCountryFromBrowserLang();
        const res: GeoCountryResult = {
          country: manualCountry || fallback.country,
          language: manualLang || fallback.lang,
          coords: null,
          source: manualCountry ? 'MANUAL_USER' : 'BROWSER_FALLBACK',
        };
        this.broadcastChange(res);
        resolve(res);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const detectedCountry = determineCountryFromCoords(latitude, longitude);
          const mappedLang: ServiceLanguage = detectedCountry === 'JP' ? 'ja' : detectedCountry === 'KR' ? 'ko' : 'en';

          const effectiveCountry = manualCountry || detectedCountry;
          const effectiveLang = manualLang || mappedLang;

          try {
            localStorage.setItem(STORAGE_KEYS.CACHED_GEO, JSON.stringify({ lat: latitude, lng: longitude, accuracy }));
            localStorage.setItem(STORAGE_KEYS.SERVICE_COUNTRY, effectiveCountry === 'JP' ? 'JP' : 'KR');
          } catch {}

          const res: GeoCountryResult = {
            country: effectiveCountry,
            language: effectiveLang,
            coords: { lat: latitude, lng: longitude, accuracy },
            source: manualCountry ? 'MANUAL_USER' : 'REAL_GPS',
          };
          this.broadcastChange(res);
          resolve(res);
        },
        () => {
          // GPS 실패/거부 시 Fallback
          const fallback = determineCountryFromBrowserLang();
          const res: GeoCountryResult = {
            country: manualCountry || fallback.country,
            language: manualLang || fallback.lang,
            coords: null,
            source: manualCountry ? 'MANUAL_USER' : 'BROWSER_FALLBACK',
          };
          this.broadcastChange(res);
          resolve(res);
        },
        { timeout: 6000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    });
  },

  /**
   * 변경 사항을 전역 이벤트로 전파 (컴포넌트 자동 반응)
   */
  broadcastChange(result: GeoCountryResult): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('parkon_country_changed', { detail: result }));
    window.dispatchEvent(new CustomEvent('parky_lang_changed', { detail: { language: result.language } }));
    window.dispatchEvent(new CustomEvent('parky_geo_updated', { detail: result }));
  },
};
