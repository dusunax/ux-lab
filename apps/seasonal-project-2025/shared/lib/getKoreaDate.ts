/**
 * 한국 시간대 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getKoreaDate(): string {
  const now = new Date();
  // 한국 시간대 (Asia/Seoul, UTC+9)로 포맷팅
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now);
}
