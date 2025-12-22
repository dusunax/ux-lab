import { headers } from "next/headers";

/**
 * 로컬 IP 주소를 정규화 (IPv6 localhost를 IPv4로 변환)
 */
function normalizeLocalIp(ip: string): string {
  // IPv6 localhost를 IPv4로 변환
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }
  return ip;
}

/**
 * 클라이언트 IP 주소 추출
 * Next.js Server Action에서 사용
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있을 경우)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // 여러 IP가 있을 경우 첫 번째 IP 사용
    const ip = forwardedFor.split(",")[0].trim();
    return normalizeLocalIp(ip);
  }

  // X-Real-IP 헤더 확인
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return normalizeLocalIp(realIp.trim());
  }

  // CF-Connecting-IP 헤더 확인 (Cloudflare)
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return normalizeLocalIp(cfConnectingIp.trim());
  }

  // 기본값 (로컬 개발 환경)
  return "127.0.0.1";
}
