// apps/parkon/src/lib/chroniclePhotoStorage.ts
// 나의 파크골프 연대기 전용 포토 앨범 저장소 (IndexedDB 기반 대용량 + Canvas WebP 자동 압축)

export interface ChroniclePhotoItem {
  id: string;
  sessionId?: string; // 연결된 경기 라운드 세션 ID
  courseId?: string; // 구장 ID
  courseName: string; // 구장명
  date: string; // 라운드/촬영 날짜 (예: 2026-10-07)
  holeInfo?: string; // 홀 정보 (예: 'A코스 3번홀', '18홀 완주')
  companions: string[]; // 동반자 목록 (예: ['나', '홍길동', '김파크'])
  scoreSummary?: string; // 타수 요약 (예: '74타 (1위, -2)')
  memo?: string; // 한줄 소감/메모
  imageUrl: string; // 최적화 압축 사진 (WebP Base64 DataURL)
  thumbnailUrl: string; // 빠른 바둑판 로딩용 미니 썸네일
  createdAt: number;
}

const DB_NAME = 'parkon_chronicle_db';
const DB_VERSION = 1;
const STORE_NAME = 'chronicle_photos';
const LOCALSTORAGE_FALLBACK_KEY = 'parkon_chronicle_photos_fallback_v1';

class ChroniclePhotoStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isIndexedDBSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBSupported()) {
      return Promise.reject(new Error('IndexedDB not supported in this environment'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by_session', 'sessionId', { unique: false });
            store.createIndex('by_course', 'courseName', { unique: false });
            store.createIndex('by_created', 'createdAt', { unique: false });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[ChroniclePhotoStorage] IndexedDB open error, falling back:', req.error);
          reject(req.error);
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // LocalStorage Fallback helpers
  private getFallbackPhotos(): ChroniclePhotoItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveFallbackPhotos(photos: ChroniclePhotoItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCALSTORAGE_FALLBACK_KEY, JSON.stringify(photos));
    } catch (e) {
      console.warn('[ChroniclePhotoStorage] LocalStorage quota exceeded:', e);
    }
  }

  // 1. 전체 사진 목록 조회 (최신 등록순)
  public async getAllPhotos(): Promise<ChroniclePhotoItem[]> {
    if (!this.isIndexedDBSupported()) {
      return this.getFallbackPhotos().sort((a, b) => b.createdAt - a.createdAt);
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list: ChroniclePhotoItem[] = req.result || [];
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        };
        req.onerror = () => {
          resolve(this.getFallbackPhotos().sort((a, b) => b.createdAt - a.createdAt));
        };
      });
    } catch {
      return this.getFallbackPhotos().sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  // 2. 특정 라운드(세션 ID)에 등록된 사진들 조회
  public async getPhotosBySessionId(sessionId: string): Promise<ChroniclePhotoItem[]> {
    const all = await this.getAllPhotos();
    return all.filter((p) => p.sessionId === sessionId);
  }

  // 3. 특정 구장에 등록된 사진들 조회
  public async getPhotosByCourse(courseName: string): Promise<ChroniclePhotoItem[]> {
    const all = await this.getAllPhotos();
    return all.filter((p) => p.courseName === courseName);
  }

  // 4. 신규 사진 추가
  public async addPhoto(
    data: Omit<ChroniclePhotoItem, 'id' | 'createdAt'>
  ): Promise<ChroniclePhotoItem> {
    const newItem: ChroniclePhotoItem = {
      ...data,
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: Date.now(),
    };

    if (!this.isIndexedDBSupported()) {
      const list = this.getFallbackPhotos();
      list.unshift(newItem);
      this.saveFallbackPhotos(list);
      return newItem;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(newItem);

        req.onsuccess = () => {
          // Fallback sync as well (small summary or up to quota)
          try {
            const fbList = this.getFallbackPhotos();
            fbList.unshift(newItem);
            if (fbList.length > 30) fbList.pop(); // keep fallback small
            this.saveFallbackPhotos(fbList);
          } catch {}
          resolve(newItem);
        };
        req.onerror = () => {
          // If IndexedDB fails, store in fallback
          const list = this.getFallbackPhotos();
          list.unshift(newItem);
          this.saveFallbackPhotos(list);
          resolve(newItem);
        };
      });
    } catch {
      const list = this.getFallbackPhotos();
      list.unshift(newItem);
      this.saveFallbackPhotos(list);
      return newItem;
    }
  }

  // 5. 사진 메모 수정
  public async updatePhotoMemo(id: string, memo: string): Promise<void> {
    const all = await this.getAllPhotos();
    const target = all.find((p) => p.id === id);
    if (!target) return;

    target.memo = memo;

    if (!this.isIndexedDBSupported()) {
      this.saveFallbackPhotos(all);
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(target);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          this.saveFallbackPhotos(all);
          resolve();
        };
      });
    } catch {
      this.saveFallbackPhotos(all);
    }
  }

  // 6. 사진 삭제
  public async deletePhoto(id: string): Promise<void> {
    // Update fallback
    const fbList = this.getFallbackPhotos().filter((p) => p.id !== id);
    this.saveFallbackPhotos(fbList);

    if (!this.isIndexedDBSupported()) return;

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  }

  // 7. 대량 사진 병합 (복원용)
  public async bulkAddPhotos(photos: ChroniclePhotoItem[]): Promise<number> {
    if (!photos || photos.length === 0) return 0;
    const existing = await this.getAllPhotos();
    const existingIds = new Set(existing.map((p) => p.id));
    const newItems = photos.filter((p) => !existingIds.has(p.id));
    if (newItems.length === 0) return 0;

    if (!this.isIndexedDBSupported()) {
      const merged = [...newItems, ...existing];
      this.saveFallbackPhotos(merged.slice(0, 30));
      return newItems.length;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        let addedCount = 0;
        for (const item of newItems) {
          store.put(item);
          addedCount++;
        }
        tx.oncomplete = () => {
          const merged = [...newItems, ...existing];
          this.saveFallbackPhotos(merged.slice(0, 30));
          resolve(addedCount);
        };
        tx.onerror = () => {
          const merged = [...newItems, ...existing];
          this.saveFallbackPhotos(merged.slice(0, 30));
          resolve(newItems.length);
        };
      });
    } catch {
      const merged = [...newItems, ...existing];
      this.saveFallbackPhotos(merged.slice(0, 30));
      return newItems.length;
    }
  }

  // 8. 로컬 백업 파일 다운로드 (JSON)
  public async exportBackupFile(): Promise<{ photosCount: number; roundsCount: number; fileName: string }> {
    const photos = await this.getAllPhotos();
    let completedRounds: any[] = [];
    let badges: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const rawRounds = localStorage.getItem('parkon_completed_rounds');
        if (rawRounds) completedRounds = JSON.parse(rawRounds);
      } catch {}
      try {
        const rawBadges = localStorage.getItem('parkon_course_badges');
        if (rawBadges) badges = JSON.parse(rawBadges);
      } catch {}
    }

    const backupData = {
      app: 'ParkGolf All-in-One',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      photos,
      completedRounds,
      badges,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = 'parkon_chronicle_backup.json';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      photosCount: photos.length,
      roundsCount: completedRounds.length,
      fileName,
    };
  }

  // 9. 로컬 백업 파일 복원 및 병합
  public async importBackupFile(file: File): Promise<{ photosCount: number; roundsCount: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            reject(new Error('Empty file'));
            return;
          }
          const data = JSON.parse(text);
          const rawPhotos: ChroniclePhotoItem[] = Array.isArray(data.photos) ? data.photos : [];
          const rawRounds: any[] = Array.isArray(data.completedRounds) ? data.completedRounds : [];
          const rawBadges: any[] = Array.isArray(data.badges) ? data.badges : [];

          // 1. Restore photos
          const photosCount = await this.bulkAddPhotos(rawPhotos);

          // 2. Restore completed rounds
          let roundsCount = 0;
          if (typeof window !== 'undefined' && rawRounds.length > 0) {
            try {
              let existingRounds: any[] = [];
              const rawExisting = localStorage.getItem('parkon_completed_rounds');
              if (rawExisting) existingRounds = JSON.parse(rawExisting);
              const existingIds = new Set(existingRounds.map((r: any) => r.id));
              const newRounds = rawRounds.filter((r: any) => !existingIds.has(r.id));
              if (newRounds.length > 0) {
                const mergedRounds = [...newRounds, ...existingRounds];
                localStorage.setItem('parkon_completed_rounds', JSON.stringify(mergedRounds));
                roundsCount = newRounds.length;
              }
            } catch (err) {
              console.warn('[ChroniclePhotoStorage] Failed to merge rounds:', err);
            }
          }

          // 3. Restore badges if present
          if (typeof window !== 'undefined' && rawBadges.length > 0) {
            try {
              let existingBadges: any[] = [];
              const rawExistingB = localStorage.getItem('parkon_course_badges');
              if (rawExistingB) existingBadges = JSON.parse(rawExistingB);
              const bMap = new Map();
              existingBadges.forEach((b: any) => bMap.set(b.courseId, b));
              rawBadges.forEach((b: any) => {
                if (!bMap.has(b.courseId) || (b.visitCount || 0) > (bMap.get(b.courseId)?.visitCount || 0)) {
                  bMap.set(b.courseId, b);
                }
              });
              localStorage.setItem('parkon_course_badges', JSON.stringify(Array.from(bMap.values())));
            } catch {}
          }

          resolve({ photosCount, roundsCount });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }
}

export const ChroniclePhotoStorage = new ChroniclePhotoStorageService();

// Canvas 기반 이미지 스마트 리사이징 & WebP 압축 파이프라인
export async function compressAndProcessImage(
  fileOrBase64: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 1. 원본 비율 계산 및 메인 압축 (최대 1200px)
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // WebP 지원 확인 후 인코딩 (fallback to jpeg)
        let mainDataUrl = canvas.toDataURL('image/webp', quality);
        if (!mainDataUrl.startsWith('data:image/webp')) {
          mainDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // 2. 바둑판 그리드용 초경량 정사각형 썸네일 (280x280)
        const thumbCanvas = document.createElement('canvas');
        const thumbSize = 280;
        thumbCanvas.width = thumbSize;
        thumbCanvas.height = thumbSize;
        const thumbCtx = thumbCanvas.getContext('2d');

        if (thumbCtx) {
          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          thumbCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, thumbSize, thumbSize);
        }

        let thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.75);
        if (!thumbDataUrl.startsWith('data:image/webp')) {
          thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);
        }

        resolve({
          imageUrl: mainDataUrl,
          thumbnailUrl: thumbDataUrl,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Image load failed'));

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
