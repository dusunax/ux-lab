import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WebcamPermission } from './WebcamPermission'

describe('WebcamPermission', () => {
  it('renders permission overlay in idle state', () => {
    render(<WebcamPermission status="idle" onAllow={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByTestId('webcam-permission')).toBeInTheDocument()
    expect(screen.getByTestId('webcam-allow-btn')).toBeInTheDocument()
    expect(screen.getByTestId('webcam-skip-btn')).toBeInTheDocument()
  })

  it('calls onAllow when camera button clicked', () => {
    const onAllow = vi.fn()
    render(<WebcamPermission status="idle" onAllow={onAllow} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByTestId('webcam-allow-btn'))
    expect(onAllow).toHaveBeenCalledOnce()
  })

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn()
    render(<WebcamPermission status="idle" onAllow={vi.fn()} onSkip={onSkip} />)
    fireEvent.click(screen.getByTestId('webcam-skip-btn'))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('shows loading spinner in requesting state (no action buttons)', () => {
    render(<WebcamPermission status="requesting" onAllow={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.queryByTestId('webcam-allow-btn')).not.toBeInTheDocument()
  })

  it('shows skip button only in error state', () => {
    render(<WebcamPermission status="error" onAllow={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.queryByTestId('webcam-allow-btn')).not.toBeInTheDocument()
    expect(screen.getByTestId('webcam-skip-btn')).toBeInTheDocument()
  })
})
