import { createHash } from "crypto";

/**
 * IP와 날짜를 조합하여 해시값 생성
 * 개인정보 보호를 위해 IP 주소를 직접 저장하지 않음
 * @param ip IP 주소
 * @param date 날짜 (YYYY-MM-DD 형식)
 * @returns SHA-256 해시값
 */
export function hashIpAndDate(ip: string, date: string): string {
  const combined = `${ip}_${date}`;
  return createHash("sha256").update(combined).digest("hex");
}

