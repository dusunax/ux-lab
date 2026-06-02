import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAiVisualParams } from './useAiVisualParams'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function makeOkResponse(params: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: JSON.stringify(params) } }],
    }),
  })
}

describe('useAiVisualParams', () => {
  it('returns fallback params immediately without API call', () => {
    const { result } = renderHook(() =>
      useAiVisualParams('standing', 0, { debounceMs: 1000 })
    )
    expect(result.current.params.primaryColor).toBeTruthy()
    expect(result.current.isLoading).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('triggers fetch after debounce when pose changes', async () => {
    const aiParams = {
      primaryColor: '#abcdef',
      accentColor: '#fedcba',
      particleDensity: 0.8,
      effectIntensity: 0.7,
      trailLength: 60,
    }
    mockFetch.mockReturnValue(makeOkResponse(aiParams))

    const { result, rerender } = renderHook(
      ({ label }: { label: Parameters<typeof useAiVisualParams>[0] }) =>
        useAiVisualParams(label, 0.5, { debounceMs: 500, apiEndpoint: 'http://test/chat' }),
      { initialProps: { label: 'standing' as const } }
    )

    rerender({ label: 'arms-raised' })

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('http://test/chat')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.messages[0].content).toContain('arms-raised')
  })

  it('keeps fallback params when API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))

    const { result, rerender } = renderHook(
      ({ label }: { label: Parameters<typeof useAiVisualParams>[0] }) =>
        useAiVisualParams(label, 0, { debounceMs: 100, apiEndpoint: 'http://test/chat' }),
      { initialProps: { label: 'standing' as const } }
    )

    rerender({ label: 'arms-raised' })

    // Fire debounce + let rejected promise microtasks settle
    await act(async () => {
      vi.advanceTimersByTime(200)
      await Promise.resolve()
      await Promise.resolve()
    })

    // isLoading becomes true then false via .finally() — params remain valid strings
    expect(typeof result.current.params.primaryColor).toBe('string')
    expect(result.current.params.primaryColor).toBeTruthy()
  })

  it('does not call API when pose label stays the same', async () => {
    const { rerender } = renderHook(
      ({ energy }: { energy: number }) =>
        useAiVisualParams('standing', energy, { debounceMs: 100, apiEndpoint: 'http://test/chat' }),
      { initialProps: { energy: 0.1 } }
    )

    // Only energy changes; label stays 'standing' — no fetch should be triggered
    rerender({ energy: 0.9 })
    await act(async () => { vi.advanceTimersByTime(200) })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
