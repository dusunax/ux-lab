import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WebcamPermission } from './WebcamPermission'

describe('WebcamPermission', () => {
  it('renders permission overlay in idle state', () => {
    render(<WebcamPermission status="idle" onAllow={vi.fn()} />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
    expect(screen.getByTestId('webcam-allow-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('webcam-skip-btn')).not.toBeInTheDocument()
  })

  it('calls onAllow when camera button clicked', () => {
    const onAllow = vi.fn()
    render(<WebcamPermission status="idle" onAllow={onAllow} />)
    fireEvent.click(screen.getByTestId('webcam-allow-btn'))
    expect(onAllow).toHaveBeenCalledOnce()
  })

  it('shows loading spinner in requesting state (no action buttons)', () => {
    render(<WebcamPermission status="requesting" onAllow={vi.fn()} />)
    expect(screen.queryByTestId('webcam-allow-btn')).not.toBeInTheDocument()
  })

  it('shows retry button in error state with no skip option (canFallback=false 기본값)', () => {
    render(<WebcamPermission status="error" onAllow={vi.fn()} />)
    expect(screen.getByTestId('webcam-allow-btn')).toBeInTheDocument()
    expect(screen.getByTestId('webcam-allow-btn')).toHaveTextContent('다시 시도')
    expect(screen.queryByTestId('webcam-skip-btn')).not.toBeInTheDocument()
  })

  it('calls onAllow when retry button clicked in error state', () => {
    const onAllow = vi.fn()
    render(<WebcamPermission status="error" onAllow={onAllow} />)
    fireEvent.click(screen.getByTestId('webcam-allow-btn'))
    expect(onAllow).toHaveBeenCalledOnce()
  })

  it('canFallback=true이고 onDenied가 있으면 에러 상태에서 skip 버튼이 표시된다', () => {
    const onDenied = vi.fn()
    render(
      <WebcamPermission
        status="error"
        onAllow={vi.fn()}
        onDenied={onDenied}
        canFallback={true}
      />
    )
    expect(screen.getByTestId('webcam-skip-btn')).toBeInTheDocument()
    expect(screen.getByTestId('webcam-skip-btn')).toHaveTextContent('마우스로 계속하기')
  })

  it('skip 버튼 클릭 시 onDenied(true)가 호출된다', () => {
    const onDenied = vi.fn()
    render(
      <WebcamPermission
        status="error"
        onAllow={vi.fn()}
        onDenied={onDenied}
        canFallback={true}
      />
    )
    fireEvent.click(screen.getByTestId('webcam-skip-btn'))
    expect(onDenied).toHaveBeenCalledWith(true)
  })

  it('canFallback=false이면 onDenied가 있어도 skip 버튼이 없다', () => {
    render(
      <WebcamPermission
        status="error"
        onAllow={vi.fn()}
        onDenied={vi.fn()}
        canFallback={false}
      />
    )
    expect(screen.queryByTestId('webcam-skip-btn')).not.toBeInTheDocument()
  })
})
