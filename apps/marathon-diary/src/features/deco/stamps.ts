import { StampAsset } from '../../types/decoration'

export const STAMP_ASSETS: StampAsset[] = [
  // 완주 도장
  { id: 'finish-medal', emoji: '🏅', label: '메달', category: 'finish' },
  { id: 'finish-gold', emoji: '🥇', label: '금메달', category: 'finish' },
  { id: 'finish-silver', emoji: '🥈', label: '은메달', category: 'finish' },
  { id: 'finish-bronze', emoji: '🥉', label: '동메달', category: 'finish' },

  // 날씨
  { id: 'weather-sun', emoji: '☀️', label: '맑음', category: 'weather' },
  { id: 'weather-rain', emoji: '🌧️', label: '비', category: 'weather' },
  { id: 'weather-snow', emoji: '❄️', label: '눈', category: 'weather' },
  { id: 'weather-wind', emoji: '💨', label: '바람', category: 'weather' },

  // 감정
  { id: 'emotion-fire', emoji: '🔥', label: '뜨거워', category: 'emotion' },
  { id: 'emotion-star', emoji: '⭐', label: '최고', category: 'emotion' },
  { id: 'emotion-strong', emoji: '💪', label: '파이팅', category: 'emotion' },
  { id: 'emotion-heart', emoji: '❤️', label: '사랑', category: 'emotion' },

  // 코스
  { id: 'course-runner', emoji: '🏃', label: '달리기', category: 'course' },
  { id: 'course-road', emoji: '🛣️', label: '도로', category: 'course' },
  { id: 'course-forest', emoji: '🌲', label: '산림', category: 'course' },
  { id: 'course-city', emoji: '🌃', label: '야경', category: 'course' },
]

export const CATEGORY_LABELS: Record<StampAsset['category'], string> = {
  finish: '완주 도장',
  weather: '날씨',
  emotion: '감정',
  course: '코스',
}

export const STAMP_MAP = new Map(STAMP_ASSETS.map((s) => [s.id, s]))
