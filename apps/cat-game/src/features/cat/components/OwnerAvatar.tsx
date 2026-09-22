import type { OwnerId } from '../owners'
import { Sprite } from './Sprite'

/** 집사 전신 (선택 화면 미리보기용). CSS가 breakpoint별로 height를 덮어쓰므로,
 * width는 style: 'auto'로 둬 HTML width/height 속성에서 유도된 비율을 그대로 따라가게 한다
 * (두 속성이 모두 있으면 브라우저가 로드 전에도 비율을 알아 레이아웃 쉬프트가 없다). */
export function OwnerFigure({ ownerId, height, className }: { ownerId: OwnerId; height: number; className?: string }) {
  return <Sprite name={`owner-${ownerId}`} height={height} className={className} style={{ width: 'auto' }} draggable={false} />
}

/** 집사 얼굴 (채팅 말풍선 옆 아바타용) */
export function OwnerHead({ ownerId, size = 42, className }: { ownerId: OwnerId; size?: number; className?: string }) {
  return <Sprite name={`owner-${ownerId}-head`} width={size} height={size} className={className} draggable={false} />
}
