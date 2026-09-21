import { josa } from 'es-hangul'
import { ImageButton } from './ImageButton'

interface Props {
  catName: string
  onRestart: () => void
}

/** 하트를 모두 잃었을 때 입력창 대신 보여주는 안내 */
export function GameOverBar({ catName, onRestart }: Props) {
  return (
    <div className="composer gameover" role="status">
      <p>{josa(catName, '이/가')} 지쳐서 더 이상 반응할 수 없어요.</p>
      <ImageButton sprite="btn-refresh" label="다시하기" onClick={onRestart} height={52} />
    </div>
  )
}
