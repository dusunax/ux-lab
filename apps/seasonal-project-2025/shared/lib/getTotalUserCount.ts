"use server";

import { getDb } from "./firebase-admin";

/**
 * 총 사용자 수 조회 (rateLimits 컬렉션의 모든 요청 횟수 합산)
 * @returns 총 요청 횟수 (전체 사용자 수)
 */
export async function getTotalUserCount(): Promise<number> {
  try {
    let db;
    try {
      db = getDb();
    } catch (dbError) {
      throw new Error("Firebase DB 초기화 실패");
    }

    // rateLimits 컬렉션의 모든 문서 조회
    const rateLimitsRef = db.collection("rateLimits");
    const snapshot = await rateLimitsRef.get();

    if (snapshot.empty) {
      return 0;
    }

    let totalCount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const count = data?.count || 0;
      totalCount += count;
    });

    return totalCount;
  } catch (error) {
    console.error("총 사용자 수 조회 실패:", error);
    return 0;
  }
}

