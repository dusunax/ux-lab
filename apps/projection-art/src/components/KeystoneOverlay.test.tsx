import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeystoneOverlay, DEFAULT_CORNERS } from './KeystoneOverlay'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

beforeEach(() => mockLocalStorage.clear())

describe('KeystoneOverlay', () => {
  it('renders children', () => {
    render(
      <KeystoneOverlay visible={false} corners={DEFAULT_CORNERS} onCornersChange={vi.fn()}>
        <div data-testid="child">hello</div>
      </KeystoneOverlay>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies matrix3d transform to canvas wrapper', () => {
    render(
      <KeystoneOverlay visible={false} corners={DEFAULT_CORNERS} onCornersChange={vi.fn()}>
        <div />
      </KeystoneOverlay>
    )
    const canvas = screen.getByTestId('keystone-canvas')
    expect(canvas.style.transform).toMatch(/matrix3d/)
  })

  it('shows 4 corner handles and reset button when visible=true', () => {
    render(
      <KeystoneOverlay visible={true} corners={DEFAULT_CORNERS} onCornersChange={vi.fn()}>
        <div />
      </KeystoneOverlay>
    )
    expect(screen.getByTestId('keystone-handle-tl')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-tr')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-bl')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-handle-br')).toBeInTheDocument()
    expect(screen.getByTestId('keystone-reset')).toBeInTheDocument()
  })

  it('hides handles when visible=false', () => {
    render(
      <KeystoneOverlay visible={false} corners={DEFAULT_CORNERS} onCornersChange={vi.fn()}>
        <div />
      </KeystoneOverlay>
    )
    expect(screen.queryByTestId('keystone-handle-tl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('keystone-reset')).not.toBeInTheDocument()
  })

  it('calls onCornersChange with DEFAULT_CORNERS on reset', () => {
    const onChange = vi.fn()
    const modifiedCorners = { tl: { dx: 10, dy: 5 }, tr: { dx: 0, dy: 0 }, bl: { dx: 0, dy: 0 }, br: { dx: 0, dy: 0 } }
    render(
      <KeystoneOverlay visible={true} corners={modifiedCorners} onCornersChange={onChange}>
        <div />
      </KeystoneOverlay>
    )
    fireEvent.click(screen.getByTestId('keystone-reset'))
    expect(onChange).toHaveBeenCalledWith(DEFAULT_CORNERS)
  })
})
