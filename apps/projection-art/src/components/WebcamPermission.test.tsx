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

  it('shows retry button in error state with no skip option', () => {
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
})
