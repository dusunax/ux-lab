import type { OwnerId } from '../owners'
import { spriteUrl } from './CatAvatar'

/** 집사 전신 (선택 화면 미리보기용) */
export function OwnerFigure({ ownerId, height, className }: { ownerId: OwnerId; height: number; className?: string }) {
  return <img src={spriteUrl(`owner-${ownerId}`)} height={height} className={className} style={{ width: 'auto' }} alt="" draggable={false} />
}

/** 집사 얼굴 (채팅 말풍선 옆 아바타용) */
export function OwnerHead({ ownerId, size = 42, className }: { ownerId: OwnerId; size?: number; className?: string }) {
  return <img src={spriteUrl(`owner-${ownerId}-head`)} width={size} height={size} className={className} alt="" draggable={false} />
}
