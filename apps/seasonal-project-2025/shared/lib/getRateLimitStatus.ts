"use server";

import { getDb } from "./firebase-admin";
import { getClientIp } from "./getClientIp";
import { getKoreaDate } from "./getKoreaDate";

const MAX_REQUESTS_PER_DAY = 5;

interface RateLimitStatus {
  remaining: number;
  used: number;
  total: number;
  resetDate: string;
}

/**
 * 현재 IP의 요청 제한 상태 조회 (요청 횟수 증가 없이)
 * @returns 남은 요청 횟수, 사용한 횟수, 전체 횟수, 리셋 날짜
 */
export async function getRateLimitStatus(): Promise<RateLimitStatus> {
  const ip = await getClientIp();
  const today = getKoreaDate();

  try {
    // Firebase 초기화 실패 시 기본값 반환
    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.error("Firebase DB 초기화 실패, 기본값 반환:", dbError);
      // Firebase 초기화 실패 시 기본값 반환
      return {
        remaining: MAX_REQUESTS_PER_DAY,
        used: 0,
        total: MAX_REQUESTS_PER_DAY,
        resetDate: today,
      };
    }

    const docId = `${ip}_${today}`;
    const docRef = db.collection("rateLimits").doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        remaining: MAX_REQUESTS_PER_DAY,
        used: 0,
        total: MAX_REQUESTS_PER_DAY,
        resetDate: today,
      };
    }

    const data = doc.data();
    const currentCount = data?.count || 0;
    const remaining = Math.max(0, MAX_REQUESTS_PER_DAY - currentCount);

    return {
      remaining,
      used: currentCount,
      total: MAX_REQUESTS_PER_DAY,
      resetDate: today,
    };
  } catch (error) {
    console.error("Rate limit 상태 조회 실패:", error);
    // 에러 발생 시 기본값 반환
    return {
      remaining: MAX_REQUESTS_PER_DAY,
      used: 0,
      total: MAX_REQUESTS_PER_DAY,
      resetDate: today,
    };
  }
}
