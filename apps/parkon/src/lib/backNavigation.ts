'use client';

import { useEffect, useRef } from 'react';

type BackEntry = {
  id: string;
  onBack: () => void;
};

const backStack: BackEntry[] = [];
let idSeq = 0;
const listeners = new Set<() => void>();

function notifyStackChange() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

export function pushBackHandler(onBack: () => void): string {
  const id = `parky_back_${++idSeq}`;
  backStack.push({ id, onBack });
  notifyStackChange();
  return id;
}

export function removeBackHandler(id: string) {
  const idx = backStack.findIndex((entry) => entry.id === id);
  if (idx !== -1) {
    backStack.splice(idx, 1);
    notifyStackChange();
  }
}

export function popAndRunBackHandler(): boolean {
  const top = backStack.pop();
  if (!top) return false;
  notifyStackChange();
  try {
    top.onBack();
  } catch {
    // ignore callback errors
  }
  return true;
}

export function getBackStackSize(): number {
  return backStack.length;
}

export function subscribeBackStack(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Registers a LIFO back-button handler whenever `active` is true.
 * Pressing Android/browser Back closes the topmost active modal/popup
 * instead of exiting the app.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const id = pushBackHandler(() => onBackRef.current());
    return () => {
      removeBackHandler(id);
    };
  }, [active]);
}
