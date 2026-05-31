import '@testing-library/jest-dom'

// ─── Canvas / WebGL Mock ────────────────────────────────────────────────────

const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
}

const mockWebGLContext = {
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  getUniformLocation: vi.fn(() => ({})),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  drawArrays: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  ARRAY_BUFFER: 0,
  FLOAT: 0,
  TRIANGLES: 0,
  COLOR_BUFFER_BIT: 0,
  DEPTH_BUFFER_BIT: 0,
  VERTEX_SHADER: 0,
  FRAGMENT_SHADER: 0,
  BLEND: 0,
  SRC_ALPHA: 0,
  ONE_MINUS_SRC_ALPHA: 0,
}

HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') return mockCanvasContext
  if (contextType === 'webgl' || contextType === 'webgl2') return mockWebGLContext
  return null
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ─── AudioContext Mock ──────────────────────────────────────────────────────

class MockAnalyserNode {
  fftSize = 2048
  frequencyBinCount = 1024
  connect = vi.fn()
  disconnect = vi.fn()
  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    array.fill(128)
  })
  getByteTimeDomainData = vi.fn((array: Uint8Array) => {
    array.fill(128)
  })
}

class MockAudioContext {
  state: AudioContextState = 'suspended'
  sampleRate = 44100
  destination = { connect: vi.fn() }

  createAnalyser = vi.fn(() => new MockAnalyserNode())
  createMediaElementSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }))
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }))
  createBiquadFilter = vi.fn(() => ({
    type: 'lowpass' as BiquadFilterType,
    frequency: { value: 1000 },
    Q: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))
  resume = vi.fn(() => {
    this.state = 'running'
    return Promise.resolve()
  })
  suspend = vi.fn(() => {
    this.state = 'suspended'
    return Promise.resolve()
  })
  close = vi.fn(() => {
    this.state = 'closed'
    return Promise.resolve()
  })
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
})

// ─── requestAnimationFrame Mock ─────────────────────────────────────────────
// 콜백을 자동 실행하지 않음 — RAF 루프의 비동기 teardown 에러 방지
// RAF 동작을 검증해야 하는 테스트는 vi.useFakeTimers()를 사용할 것

let rafId = 0
window.requestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => {
  rafId += 1
  return rafId
})
window.cancelAnimationFrame = vi.fn()

// ─── Fullscreen API Mock ────────────────────────────────────────────────────

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
})

// ─── HTMLMediaElement Mock ──────────────────────────────────────────────────

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
})

// ─── mediaDevices Mock ──────────────────────────────────────────────────────

const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
  getVideoTracks: vi.fn(() => [{ stop: vi.fn() }]),
  getAudioTracks: vi.fn(() => []),
}

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
    getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
  },
})

// ─── URL Mock ───────────────────────────────────────────────────────────────

Object.defineProperty(globalThis.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// ─── ResizeObserver Mock ────────────────────────────────────────────────────

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})

// ─── R3F 경고 필터 ──────────────────────────────────────────────────────────
// jsdom 환경에서 R3F Three.js 원소(<mesh>, <bufferGeometry> 등)가
// React DOM 경고를 유발함. 테스트는 통과하지만 노이즈가 실제 오류 탐지를 방해함.
// R3F Three.js 원소들이 jsdom 환경에서 React DOM 경고를 유발하는 패턴을 선택적으로 억제
// React는 일부 경고를 format string(%s)으로 분리해 전달하므로 args를 병합해 검사
const _stdError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  const msg = args.map(a => String(a ?? '')).join(' ')
  if (
    /is not recognized as a known DOM element/i.test(msg) ||
    /is using incorrect casing\. Use PascalCase/i.test(msg) ||
    /React does not recognize the .+ prop on a DOM element/i.test(msg) ||
    /non-boolean attribute/i.test(msg) ||
    (/The tag/i.test(msg) && /is unrecognized in this browser/i.test(msg))
  ) return
  _stdError(...args)
}
