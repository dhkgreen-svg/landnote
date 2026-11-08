'use client';

/**
 * ParkOn Senior-Friendly Web Audio Fanfare & Haptic Vibration Utility
 * Works 100% offline without external mp3 downloads.
 */

export function triggerCelebrationHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // 쾌활하고 리드미컬한 축하 진동 패턴: 징-징-징--징!
      navigator.vibrate([120, 80, 120, 80, 150, 100, 300]);
    } catch {}
  }
}

export function playCelebrationFanfare() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 환희의 팡파레 멜로디 (C5 -> E5 -> G5 -> High C6)
    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.15 }, // C5 (도)
      { freq: 659.25, time: 0.14, duration: 0.15 }, // E5 (미)
      { freq: 783.99, time: 0.28, duration: 0.22 }, // G5 (솔)
      { freq: 1046.50, time: 0.48, duration: 0.65 }, // High C6 (높은 도!)
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // 부드럽고 따뜻한 금빛 브라스/벨 음색
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch {}
}
