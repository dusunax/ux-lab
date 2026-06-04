import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeystoneOverlay, defaultTransform, DEFAULT_CORNERS } from './KeystoneOverlay'
import type { ProjectionTransform } from './KeystoneOverlay'

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

const DEFAULT_TRANSFORM: ProjectionTransform = defaultTransform(1024, 768)

beforeEach(() => mockLocalStorage.clear())

describe('KeystoneOverlay', () => {
  it('renders children', () => {
    render(
      <KeystoneOverlay visible={false} transform={DEFAULT_TRANSFORM} onTransformChange={vi.fn()}>
        <div data-testid="child">hello</div>
      </KeystoneOverlay>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies matrix3d transform to canvas wrapper', () => {
    render(
      <KeystoneOverlay visible={false} transform={DEFAULT_TRANSFORM} onTransformChange={vi.fn()}>
        <div />
      </KeystoneOverlay>
    )
    const canvas = screen.getByTestId('keystone-canvas')
    expect(canvas.style.transform).toMatch(/matrix3d/)
  })

  it('shows 4 corner handles and reset button when visible=true', () => {
    render(
      <KeystoneOverlay visible={true} transform={DEFAULT_TRANSFORM} onTransformChange={vi.fn()}>
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
      <KeystoneOverlay visible={false} transform={DEFAULT_TRANSFORM} onTransformChange={vi.fn()}>
        <div />
      </KeystoneOverlay>
    )
    expect(screen.queryByTestId('keystone-handle-tl')).not.toBeInTheDocument()
    expect(screen.queryByTestId('keystone-reset')).not.toBeInTheDocument()
  })

  it('calls onTransformChange with defaultTransform on reset', () => {
    const onChange = vi.fn()
    render(
      <KeystoneOverlay visible={true} transform={DEFAULT_TRANSFORM} onTransformChange={onChange}>
        <div />
      </KeystoneOverlay>
    )
    fireEvent.click(screen.getByTestId('keystone-reset'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rect: expect.any(Object),
        warp: expect.objectContaining({ tl: DEFAULT_CORNERS.tl }),
      })
    )
  })
})
