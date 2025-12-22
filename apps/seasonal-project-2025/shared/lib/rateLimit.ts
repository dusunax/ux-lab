import { getDb } from "./firebase-admin";
import { getClientIp } from "./getClientIp";
import { getKoreaDate } from "./getKoreaDate";

const MAX_REQUESTS_PER_DAY = 5;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetDate: string;
}

/**
 * IP 기반 일일 요청 제한 체크 및 업데이트
 * @returns 요청 허용 여부, 남은 요청 횟수, 리셋 날짜
 */
export async function checkRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const today = getKoreaDate();

  try {
    const db = getDb();
    const docId = `${ip}_${today}`;
    const docRef = db.collection("rateLimits").doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // 첫 요청: 문서 생성
      await docRef.set({
        ip,
        date: today,
        count: 1,
        lastRequestAt: new Date(),
      });

      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_DAY - 1,
        resetDate: today,
      };
    }

    const data = doc.data();
    const currentCount = data?.count || 0;

    if (currentCount >= MAX_REQUESTS_PER_DAY) {
      // 요청 제한 초과
      return {
        allowed: false,
        remaining: 0,
        resetDate: today,
      };
    }

    // 요청 횟수 증가
    await docRef.update({
      count: currentCount + 1,
      lastRequestAt: new Date(),
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_DAY - (currentCount + 1),
      resetDate: today,
    };
  } catch (error) {
    console.error("Rate limit 체크 실패:", error);
    // 에러 발생 시 요청 허용 (서비스 중단 방지)
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_DAY - 1,
      resetDate: today,
    };
  }
}
