import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeystoneOverlay } from './KeystoneOverlay'

beforeEach(() => {
  localStorage.clear()
})

describe('KeystoneOverlay', () => {
  it('renders children', () => {
    render(
      <KeystoneOverlay visible={false}>
        <div data-testid="child">content</div>
      </KeystoneOverlay>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies matrix3d transform to canvas wrapper', () => {
    render(<KeystoneOverlay visible={false}><div /></KeystoneOverlay>)
    const canvas = screen.getByTestId('keystone-canvas')
    expect(canvas.style.transform).toMatch(/matrix3d/)
  })

  it('shows 4 corner handles when visible=true', () => {
    render(<KeystoneOverlay visible={true}><div /></KeystoneOverlay>)
    expect(screen.getByTestId('keystone-handles')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-tl')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-tr')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-bl')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-br')).toBeInTheDocument()
  })

  it('hides handles when visible=false', () => {
    render(<KeystoneOverlay visible={false}><div /></KeystoneOverlay>)
    expect(screen.queryByTestId('keystone-handles')).not.toBeInTheDocument()
  })
})
