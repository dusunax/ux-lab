import { getDb } from "./firebase-admin";
import { getClientIp } from "./getClientIp";
import { getKoreaDate } from "./getKoreaDate";
import { hashIpAndDate } from "./hashIdentifier";

const MAX_REQUESTS_PER_DAY = 5;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetDate: string;
}

/**
 * IP 기반 일일 요청 제한 체크 (카운트 증가 없이)
 * @returns 요청 허용 여부, 남은 요청 횟수, 리셋 날짜
 */
export async function checkRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const today = getKoreaDate();

  try {
    // Firebase 초기화 실패 시 요청 허용 (서비스 중단 방지)
    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.error("Firebase DB 초기화 실패, rate limit 체크 건너뜀:", dbError);
      // Firebase 초기화 실패 시 요청 허용
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_DAY - 1,
        resetDate: today,
      };
    }

    const docId = hashIpAndDate(ip, today);
    const docRef = db.collection("rateLimits").doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // 첫 요청: 아직 카운트하지 않음 (성공 시에만 증가)
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_DAY,
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

    // 카운트 증가 없이 남은 횟수만 반환
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_DAY - currentCount,
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

/**
 * IP 기반 일일 요청 제한 카운트 증가 (요청 성공 시에만 호출)
 * @returns 증가 후 남은 요청 횟수, 리셋 날짜
 */
export async function incrementRateLimit(): Promise<{
  remaining: number;
  resetDate: string;
}> {
  const ip = await getClientIp();
  const today = getKoreaDate();

  try {
    // Firebase 초기화 실패 시 건너뜀
    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.error("Firebase DB 초기화 실패, rate limit 증가 건너뜀:", dbError);
      return {
        remaining: MAX_REQUESTS_PER_DAY - 1,
        resetDate: today,
      };
    }

    const docId = hashIpAndDate(ip, today);
    const docRef = db.collection("rateLimits").doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // 첫 요청: 문서 생성 (IP와 날짜는 해싱되어 docId에 포함)
      await docRef.set({
        count: 1,
        lastRequestAt: new Date(),
      });

      return {
        remaining: MAX_REQUESTS_PER_DAY - 1,
        resetDate: today,
      };
    }

    const data = doc.data();
    const currentCount = data?.count || 0;

    // 요청 횟수 증가
    await docRef.update({
      count: currentCount + 1,
      lastRequestAt: new Date(),
    });

    return {
      remaining: MAX_REQUESTS_PER_DAY - (currentCount + 1),
      resetDate: today,
    };
  } catch (error) {
    console.error("Rate limit 증가 실패:", error);
    // 에러 발생 시 기본값 반환
    return {
      remaining: MAX_REQUESTS_PER_DAY - 1,
      resetDate: today,
    };
  }
}
