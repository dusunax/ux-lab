import type { TrackerStatus } from '../hooks/useMotionTracker'

interface WebcamPermissionProps {
  status: TrackerStatus
  onAllow: () => void
  onDenied?: (canFallback: boolean) => void
  title?: string
  description?: string
  icon?: string
  /** 카메라 거부 시 마우스 폴백 가능 여부 (Demo D: true, Demo E: false) */
  canFallback?: boolean
}

const STATUS_LABELS: Partial<Record<TrackerStatus, string>> = {
  requesting: '카메라 권한 요청 중...',
  loading: 'MediaPipe 모델 로딩 중...',
}

export function WebcamPermission({
  status,
  onAllow,
  onDenied,
  title = '손으로 그리기',
  description = '웹캠으로 손 움직임을 감지하여 빛 입자를 조종해요.',
  icon,
  canFallback = false,
}: WebcamPermissionProps) {
  const isLoading = status === 'requesting' || status === 'loading'

  return (
    <div
      data-testid="webcam-permission"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        gap: '1.5rem',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: '2.5rem' }}>{status === 'error' ? '🚫' : (icon ?? '✋')}</div>

      <div style={{ textAlign: 'center', color: '#fff' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{title}</p>
        <p style={{ fontSize: '0.85rem', color: status === 'error' ? '#f66' : '#999', maxWidth: '320px' }}>
          {status === 'idle'
            ? description
            : status === 'error'
              ? '카메라 접근이 차단됐습니다. 기능을 사용할 수 없습니다.'
              : STATUS_LABELS[status]}
        </p>
      </div>

      {status === 'idle' && (
        <button
          data-testid="webcam-allow-btn"
          onClick={onAllow}
          style={{
            background: 'rgba(0,255,255,0.15)',
            color: '#0ff',
            border: '1px solid rgba(0,255,255,0.5)',
            padding: '0.6rem 1.4rem',
            borderRadius: '4px',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          카메라 허용
        </button>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <button
            data-testid="webcam-allow-btn"
            onClick={onAllow}
            style={{
              background: 'rgba(255,100,100,0.1)',
              color: '#f99',
              border: '1px solid rgba(255,100,100,0.4)',
              padding: '0.6rem 1.4rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          {canFallback && onDenied && (
            <button
              data-testid="webcam-skip-btn"
              onClick={() => onDenied(true)}
              style={{
                background: 'transparent',
                color: '#aaa',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.5rem 1.2rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              마우스로 계속하기
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div
          style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid rgba(0,255,255,0.3)',
            borderTop: '2px solid #0ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
