'use client';

export interface YardageStamp {
  id: string;
  type: 'OB' | 'BUNKER' | 'TEE_TARGET' | 'PUTT_SPOT' | 'SLOPE_LEFT' | 'SLOPE_RIGHT';
  x: number; // normalized 0..1 relative to canvas width
  y: number; // normalized 0..1 relative to canvas height
}

export interface YardageStroke {
  points: { x: number; y: number }[]; // normalized 0..1
  color?: string;
}

export type YardageHoleShape = 'STRAIGHT' | 'DOGLEG_LEFT' | 'DOGLEG_RIGHT';

export interface YardageHoleNote {
  id: string; // `${courseId}_${courseLetter}_${holeInCourse}`
  courseId: string;
  courseName: string;
  courseLetter: string;
  holeInCourse: number;
  holeNumber: number;
  par: 3 | 4 | 5;
  officialDistance: number;
  targetDistance: number;
  aimingPoint: string;
  targetScore: '버디 도전' | '파 세이브(3~4타)' | '안전 운영';
  turfType: '천연잔디' | '인조잔디';
  backSpace: '여유' | '없음(위험)';
  sideSpace: '여유' | '좁음';
  greenSpeed: '빠름(빙판)' | '보통' | '느림(까끌)';
  fairwayCondition: '양호' | '젖음/질퍽' | '맨땅 많음';
  memo: string;
  holeShape?: YardageHoleShape;
  greenAngle?: number;
  strokes: YardageStroke[];
  stamps: YardageStamp[];
  drawingDataUrl: string;
  paperNotePhotoUrl?: string;
  visibility: 'PRIVATE' | 'CLUB_SHARED';
  ownerCode?: string;
  updatedAt: string;
}

const YARDAGE_STORAGE_PREFIX = 'parkon_yardage_book_v1';
const YARDAGE_AUTO_OPEN_KEY = 'parkon_yardage_auto_open_v1';

function getActiveOwnerKey(): string {
  if (typeof window === 'undefined') return 'guest';
  try {
    const code =
      localStorage.getItem('parkon_member_code_v1') ||
      localStorage.getItem('parkon_member_code') ||
      '';
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean || 'guest';
  } catch {
    return 'guest';
  }
}

export function buildYardageNoteId(
  courseId: string,
  courseLetter: string,
  holeInCourse: number
): string {
  const safeCourse = (courseId || 'default').trim();
  const safeLetter = (courseLetter || 'A').trim().toUpperCase();
  return `${safeCourse}_${safeLetter}_${holeInCourse}`;
}

export const YardageBookStorage = {
  getStorageKey(): string {
    return `${YARDAGE_STORAGE_PREFIX}_${getActiveOwnerKey()}`;
  },

  getAllNotes(): Record<string, YardageHoleNote> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
      // Fallback check guest bucket if user just logged in
      const guestRaw = localStorage.getItem(`${YARDAGE_STORAGE_PREFIX}_guest`);
      if (guestRaw && this.getStorageKey() !== `${YARDAGE_STORAGE_PREFIX}_guest`) {
        const parsedGuest = JSON.parse(guestRaw);
        if (parsedGuest && typeof parsedGuest === 'object') return parsedGuest;
      }
      return {};
    } catch {
      return {};
    }
  },

  getNote(
    courseId: string,
    courseLetter: string,
    holeInCourse: number
  ): YardageHoleNote | null {
    const all = this.getAllNotes();
    const id = buildYardageNoteId(courseId, courseLetter, holeInCourse);
    return all[id] || null;
  },

  hasNote(
    courseId: string,
    courseLetter: string,
    holeInCourse: number
  ): boolean {
    return Boolean(this.getNote(courseId, courseLetter, holeInCourse));
  },

  saveNote(note: YardageHoleNote): void {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllNotes();
      all[note.id] = {
        ...note,
        ownerCode: getActiveOwnerKey(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('parkon_yardage_updated', { detail: { id: note.id } }));
    } catch (e) {
      console.error('Failed to save yardage note:', e);
    }
  },

  deleteNote(
    courseId: string,
    courseLetter: string,
    holeInCourse: number
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllNotes();
      const id = buildYardageNoteId(courseId, courseLetter, holeInCourse);
      if (all[id]) {
        delete all[id];
        localStorage.setItem(this.getStorageKey(), JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('parkon_yardage_updated', { detail: { id } }));
      }
    } catch {}
  },

  getAutoOpenInRound(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(YARDAGE_AUTO_OPEN_KEY) !== 'false';
    } catch {
      return true;
    }
  },

  setAutoOpenInRound(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(YARDAGE_AUTO_OPEN_KEY, enabled ? 'true' : 'false');
      window.dispatchEvent(new Event('parkon_yardage_updated'));
    } catch {}
  },
};
