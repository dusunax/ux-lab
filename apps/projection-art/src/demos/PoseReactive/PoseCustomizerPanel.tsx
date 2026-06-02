import type { VisualParams } from '../../types'

const FACE_EXPRESSIONS = ['none', '😎', '😮', '💀', '🐰', '📺'] as const
export type FaceExpression = typeof FACE_EXPRESSIONS[number]

interface Props {
  visualParams: VisualParams
  primaryColor: string
  accentColor: string
  faceExpression: FaceExpression
  onPrimaryColorChange: (color: string) => void
  onAccentColorChange: (color: string) => void
  onFaceExpressionChange: (expr: FaceExpression) => void
  onReset: () => void
}

const panelStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  background: 'rgba(0,0,12,0.93)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  padding: '1rem',
  minWidth: '228px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  backdropFilter: 'blur(8px)',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'rgba(160,160,220,0.75)',
  fontFamily: 'monospace',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '0.3rem',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const resetBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,200,100,0.7)',
  cursor: 'pointer',
  fontSize: '0.75rem',
  padding: '2px 4px',
  lineHeight: 1,
}

const colorInputStyle: React.CSSProperties = {
  width: '2rem',
  height: '1.8rem',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '3px',
  padding: 0,
  flexShrink: 0,
}

export function PoseCustomizerPanel({
  visualParams,
  primaryColor,
  accentColor,
  faceExpression,
  onPrimaryColorChange,
  onAccentColorChange,
  onFaceExpressionChange,
  onReset,
}: Props) {
  const hasCustom = primaryColor || accentColor || faceExpression !== 'none'

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...labelStyle, marginBottom: 0 }}>커스터마이즈</span>
        {hasCustom && (
          <button onClick={onReset} style={{ ...resetBtnStyle, fontSize: '0.68rem' }}>
            전체 리셋
          </button>
        )}
      </div>

      <div>
        <div style={labelStyle}>Primary (스켈레톤)</div>
        <div style={rowStyle}>
          <input
            type="color"
            value={primaryColor || visualParams.primaryColor}
            onChange={e => onPrimaryColorChange(e.target.value)}
            style={colorInputStyle}
          />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', flex: 1 }}>
            {primaryColor || visualParams.primaryColor}
          </span>
          {primaryColor
            ? <button onClick={() => onPrimaryColorChange('')} style={resetBtnStyle}>↩</button>
            : <span style={{ fontSize: '0.63rem', color: 'rgba(100,200,255,0.5)', fontFamily: 'monospace' }}>AI</span>
          }
        </div>
      </div>

      <div>
        <div style={labelStyle}>Accent (포인트)</div>
        <div style={rowStyle}>
          <input
            type="color"
            value={accentColor || visualParams.accentColor}
            onChange={e => onAccentColorChange(e.target.value)}
            style={colorInputStyle}
          />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', flex: 1 }}>
            {accentColor || visualParams.accentColor}
          </span>
          {accentColor
            ? <button onClick={() => onAccentColorChange('')} style={resetBtnStyle}>↩</button>
            : <span style={{ fontSize: '0.63rem', color: 'rgba(100,200,255,0.5)', fontFamily: 'monospace' }}>AI</span>
          }
        </div>
      </div>

      <div>
        <div style={labelStyle}>얼굴 표정</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {FACE_EXPRESSIONS.map(expr => (
            <button
              key={expr}
              onClick={() => onFaceExpressionChange(expr)}
              style={{
                background: faceExpression === expr
                  ? 'rgba(0,255,200,0.18)'
                  : 'rgba(255,255,255,0.05)',
                border: faceExpression === expr
                  ? '1px solid rgba(0,255,200,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                padding: '0.3rem 0.45rem',
                cursor: 'pointer',
                fontSize: expr === 'none' ? '0.68rem' : '1.05rem',
                color: expr === 'none' ? 'rgba(220,220,255,0.6)' : 'inherit',
                lineHeight: 1,
              }}
            >
              {expr === 'none' ? '없음' : expr}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
