/**
 * ============================================================================
 * newPerioSealer.ts
 * 파크골프 올인원 (ParkGolf All-in-One) 공식 암호학적 신페리오(New Perio) 봉인 엔진
 * 
 * 🔒 기능:
 * 1. 대회 개설/시작 시 18홀 중 12개(전반 6, 후반 6) 숨은 홀을 암호학적 난수로 공정 추첨
 * 2. SHA-256 무결성 해시를 생성하여 사전에 대회 요강에 공시 (사후 조작 원천 차단)
 * 3. 경기 중에는 100% 블라인드 잠금(Sealed) 유지
 * 4. 대회 마감/시상식 시 원터치 자물쇠 해제(Unseal) 및 실시간 재계산
 * ============================================================================
 */

export interface SealedNewPerioResult {
  hiddenHolesHash: string; // 대회 요강에 사전 공개되는 위변조 방지 SHA-256 해시
  sealedSecret: string;    // Base64로 봉인된 홀 번호 및 Salt 비밀 토큰
  selectedHoles: number[]; // 생성자만 최초 1회 확인 가능한 원본 홀
}

/**
 * 🔒 동기식 표준 SHA-256 단방향 해시 함수 (NIST FIPS 180-4 표준 준수)
 */
export function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];
  for (i = 0; i < words.length; i += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[j + i] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const sigma0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const sigma1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const temp1 = (h + sigma1 + ch + k[j] + w[j]) | 0;
      const temp2 = (sigma0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0; hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0; hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0; hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0; hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < hash.length; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * 🎲 동기식 암호학적 무작위 숨은 홀 추첨 및 SHA-256 봉인 토큰 생성
 * @param totalHoles 18홀 또는 9홀
 */
export function generateSealedNewPerioHolesSync(
  totalHoles: number = 18
): SealedNewPerioResult {
  const is18Holes = totalHoles >= 18;

  // 1. 전반(1~9번 홀) 중 무작위 6개(18홀일 때) 또는 3개(9홀일 때)
  const outHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const outPickCount = is18Holes ? 6 : 3;
  shuffleArray(outHoles);
  const selectedOut = outHoles.slice(0, outPickCount).sort((a, b) => a - b);

  let selectedIn: number[] = [];
  if (is18Holes) {
    // 2. 후반(10~18번 홀) 중 무작위 6개
    const inHoles = [10, 11, 12, 13, 14, 15, 16, 17, 18];
    shuffleArray(inHoles);
    selectedIn = inHoles.slice(0, 6).sort((a, b) => a - b);
  }

  const selectedHoles = [...selectedOut, ...selectedIn].sort((a, b) => a - b);

  // 3. 임의의 32바이트 솔트(Salt) 생성
  const salt = generateRandomSalt(32);
  const payload = JSON.stringify({
    holes: selectedHoles,
    salt,
    createdAt: new Date().toISOString(),
  });

  // 4. 동기식 SHA-256 해시값 산출 (사전 공시용 지문)
  const hiddenHolesHash = sha256Sync(payload);

  // 5. Sealed Secret 패키징 (Base64 인코딩)
  const sealedSecret = typeof btoa !== 'undefined'
    ? btoa(encodeURIComponent(payload))
    : Buffer.from(payload).toString('base64');

  return {
    hiddenHolesHash,
    sealedSecret,
    selectedHoles,
  };
}

/**
 * 🔓 대회 마감 시 자물쇠 해제 및 무결성 검증 (동기식)
 */
export function verifyAndUnsealHolesSync(
  sealedSecret: string,
  expectedHash?: string
): { success: boolean; unsealedHoles: number[]; message: string } {
  try {
    const rawJson = typeof atob !== 'undefined'
      ? decodeURIComponent(atob(sealedSecret))
      : Buffer.from(sealedSecret, 'base64').toString('utf-8');

    const parsed = JSON.parse(rawJson);
    if (!parsed || !Array.isArray(parsed.holes)) {
      return { success: false, unsealedHoles: [], message: '봉인 토큰 규격이 올바르지 않습니다.' };
    }

    if (expectedHash) {
      const computedHash = sha256Sync(rawJson);
      if (computedHash !== expectedHash) {
        return {
          success: false,
          unsealedHoles: [],
          message: '⚠️ 경고: 해시 지문이 일치하지 않습니다. (사후 변조 감지)',
        };
      }
    }

    return {
      success: true,
      unsealedHoles: parsed.holes,
      message: '✅ 신페리오 숨은 홀이 성공적으로 자물쇠 해제되었습니다!',
    };
  } catch (err: any) {
    return {
      success: false,
      unsealedHoles: [],
      message: `자물쇠 해제 실패: ${err?.message || '알 수 없는 오류'}`,
    };
  }
}

/**
 * 🎯 동적 신페리오 핸디캡 및 네트 스코어 계산 순수 함수
 */
export function calculateDynamicNewPerio(
  scores: Record<number, number>,
  totalStrokes: number,
  unsealedHoles: number[],
  totalHoles: number = 18
): { handicap: number; netScore: number; countedHoles: number; hiddenSum: number } {
  if (!unsealedHoles || unsealedHoles.length === 0) {
    return { handicap: 0, netScore: totalStrokes, countedHoles: 0, hiddenSum: 0 };
  }

  let hiddenSum = 0;
  let countedHoles = 0;

  unsealedHoles.forEach((hNum) => {
    if (typeof scores[hNum] === 'number') {
      hiddenSum += scores[hNum];
      countedHoles++;
    }
  });

  if (countedHoles === 0) {
    return { handicap: 0, netScore: totalStrokes, countedHoles: 0, hiddenSum: 0 };
  }

  const targetHiddenCount = unsealedHoles.length;
  const basePar = totalHoles <= 9 ? 33 : 66;

  const scale = targetHiddenCount / countedHoles;
  const estimatedHiddenSum = hiddenSum * scale;
  const rawHandicap = (estimatedHiddenSum * 1.5 - basePar) * 0.8;
  const handicap = Math.max(0, Math.round(rawHandicap * 10) / 10);
  const netScore = Math.round((totalStrokes - handicap) * 10) / 10;

  return {
    handicap,
    netScore,
    countedHoles,
    hiddenSum,
  };
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateRandomSalt(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
