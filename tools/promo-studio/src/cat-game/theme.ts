// apps/cat-game/src/index.css의 :root 토큰을 그대로 가져온다 (실제 앱과 같은 색을 쓰기 위해)
export const theme = {
  orange: '#ff914d',
  orangeDark: '#e97a33',
  peach: '#ffe0c2',
  cream: '#fff7ed',
  card: '#fffdf9',
  ink: '#3b2f2a',
  muted: '#8a7a70',
  line: '#f0e3d2',
  // 밈 자막(와썹맨/워크맨 스타일: 검정 배경 + 흰 글씨)용
  memeBg: '#161311',
  memeText: '#ffffff',
} as const

/**
 * apps/cat-game의 실제 데스크톱 배경(index.css .backdrop)을 그대로 가져온 값.
 * 발바닥 패턴 + 두 개의 은은한 원형 그라데이션 + 바탕 그라데이션.
 */
export const backdropBackground =
  "radial-gradient(circle at 12% 18%, rgba(255, 190, 130, 0.55), transparent 42%)," +
  'radial-gradient(circle at 88% 82%, rgba(150, 205, 255, 0.5), transparent 45%),' +
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='%23c98a55' fill-opacity='0.13'%3E%3Cellipse cx='30' cy='38' rx='7' ry='5.5'/%3E%3Ccircle cx='21' cy='30' r='2.6'/%3E%3Ccircle cx='27' cy='25' r='2.6'/%3E%3Ccircle cx='34' cy='25' r='2.6'/%3E%3Ccircle cx='40' cy='30' r='2.6'/%3E%3Cellipse cx='92' cy='92' rx='7' ry='5.5'/%3E%3Ccircle cx='83' cy='84' r='2.6'/%3E%3Ccircle cx='89' cy='79' r='2.6'/%3E%3Ccircle cx='96' cy='79' r='2.6'/%3E%3Ccircle cx='102' cy='84' r='2.6'/%3E%3C/g%3E%3C/svg%3E\")," +
  'linear-gradient(160deg, #fff3e2, #f4d6b4)'
