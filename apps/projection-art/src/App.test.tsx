import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Lazy-loaded 컴포넌트 모킹
vi.mock('./demos/ParticleFlow/ParticleFlow', () => ({
  ParticleFlow: () => <div data-testid="mock-particle-flow" />,
}))
vi.mock('./demos/NeonTunnel/NeonTunnel', () => ({
  NeonTunnel: () => <div data-testid="mock-neon-tunnel" />,
}))
vi.mock('./demos/AudioReactiveVisual/AudioReactiveVisual', () => ({
  AudioReactiveVisual: () => <div data-testid="mock-audio-reactive" />,
}))

// 온보딩 오버레이가 초기 렌더에 영향을 주지 않도록 기본적으로 완료 상태로 설정
beforeEach(() => {
  localStorage.setItem('projection-art-onboarded', '1')
})

describe('App', () => {
  it('앱 컨테이너를 렌더링한다', () => {
    render(<App />)
    expect(screen.getByTestId('app-container')).toBeInTheDocument()
  })

  it('데모 네비게이션이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-nav')).toBeInTheDocument()
  })

  it('데모 선택 버튼이 표시된다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-select-btn')).toBeInTheDocument()
  })

  it('레거시 데모 select가 숨김 상태로 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('demo-select')).toBeInTheDocument()
  })

  it('전체화면 버튼이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('fullscreen-btn')).toBeInTheDocument()
  })

  it('FPS 토글 버튼이 존재한다', () => {
    render(<App />)
    expect(screen.getByTestId('fps-toggle-btn')).toBeInTheDocument()
  })

  it('FPS 버튼 텍스트가 "성능 표시"로 표시된다', () => {
    render(<App />)
    expect(screen.getByTestId('fps-toggle-btn')).toHaveTextContent('성능 표시')
  })

  it('키스톤 버튼 텍스트가 "화면 맞추기"로 표시된다', () => {
    render(<App />)
    expect(screen.getByTestId('keystone-btn')).toHaveTextContent('화면 맞추기')
  })

  it('데모 드롭다운 변경 시 에러가 발생하지 않는다', () => {
    render(<App />)
    const select = screen.getByTestId('demo-select')
    expect(() => fireEvent.change(select, { target: { value: 'neon-tunnel' } })).not.toThrow()
    expect(() => fireEvent.change(select, { target: { value: 'audio-reactive' } })).not.toThrow()
    expect(() => fireEvent.change(select, { target: { value: 'particle-flow' } })).not.toThrow()
  })

  it('마우스 이동 이벤트를 처리한다', () => {
    render(<App />)
    const container = screen.getByTestId('app-container')
    expect(() =>
      fireEvent.mouseMove(container, { clientX: 400, clientY: 300 })
    ).not.toThrow()
  })

  it('전체화면 버튼 클릭 시 에러가 발생하지 않는다', () => {
    render(<App />)
    expect(() => fireEvent.click(screen.getByTestId('fullscreen-btn'))).not.toThrow()
  })

  it('FPS 토글 버튼 클릭 시 에러가 발생하지 않는다', () => {
    render(<App />)
    expect(() => fireEvent.click(screen.getByTestId('fps-toggle-btn'))).not.toThrow()
  })

  it('FPS 오버레이는 초기에 숨겨져 있다', () => {
    render(<App />)
    // visible=false이면 FpsOverlay가 null 반환
    expect(screen.queryByTestId('fps-overlay')).not.toBeInTheDocument()
  })

  it('FPS 버튼 클릭 시 FPS 오버레이가 표시된다', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('fps-toggle-btn'))
    expect(screen.getByTestId('fps-overlay')).toBeInTheDocument()
  })

  describe('Demo 카드 패널', () => {
    it('demo-select-btn 클릭 시 카드 패널이 열린다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('demo-select-btn'))
      expect(screen.getByTestId('demo-card-panel')).toBeInTheDocument()
    })

    it('카드 패널에 5개 데모 카드가 존재한다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('demo-select-btn'))
      expect(screen.getByTestId('demo-card-particle-flow')).toBeInTheDocument()
      expect(screen.getByTestId('demo-card-neon-tunnel')).toBeInTheDocument()
      expect(screen.getByTestId('demo-card-audio-reactive')).toBeInTheDocument()
      expect(screen.getByTestId('demo-card-hand-reactive')).toBeInTheDocument()
      expect(screen.getByTestId('demo-card-pose-reactive')).toBeInTheDocument()
    })

    it('카드 선택 시 패널이 닫힌다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('demo-select-btn'))
      fireEvent.click(screen.getByTestId('demo-card-neon-tunnel'))
      expect(screen.queryByTestId('demo-card-panel')).not.toBeInTheDocument()
    })

    it('카드에 DEMO_NATURAL_LABELS 기반 자연어 이름이 표시된다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('demo-select-btn'))
      // 자연어 이름이 카드 패널 내에 존재하는지 testid로 검증
      expect(screen.getByTestId('demo-card-particle-flow')).toBeInTheDocument()
      expect(screen.getByTestId('demo-card-neon-tunnel')).toBeInTheDocument()
      // 카드 설명 텍스트 확인
      expect(screen.getByText('손을 움직이면 빛나는 입자들이 흘러요')).toBeInTheDocument()
    })
  })

  describe('Preset 패널 레이블', () => {
    it('preset 버튼 텍스트가 "설정 저장"으로 표시된다', () => {
      render(<App />)
      expect(screen.getByTestId('preset-panel-toggle')).toHaveTextContent('설정 저장')
    })

    it('preset 패널 열렸을 때 저장 버튼 텍스트가 교체된다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('preset-panel-toggle'))
      expect(screen.getByTestId('preset-save-btn')).toHaveTextContent('이 설정 저장하기')
      expect(screen.getByTestId('preset-restore-btn')).toHaveTextContent('저장된 설정 불러오기')
      expect(screen.getByTestId('preset-clear-btn')).toHaveTextContent('설정 초기화')
    })
  })

  describe('테마 선택', () => {
    it('preset 패널 내 테마 선택기가 존재한다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('preset-panel-toggle'))
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument()
    })

    it('테마 버튼 3개가 존재한다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('preset-panel-toggle'))
      expect(screen.getByTestId('theme-btn-pastel')).toBeInTheDocument()
      expect(screen.getByTestId('theme-btn-ocean')).toBeInTheDocument()
      expect(screen.getByTestId('theme-btn-forest')).toBeInTheDocument()
    })

    it('테마 버튼 클릭 시 에러가 발생하지 않는다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('preset-panel-toggle'))
      expect(() => fireEvent.click(screen.getByTestId('theme-btn-pastel'))).not.toThrow()
    })
  })

  describe('키스톤 리셋 버튼', () => {
    it('키스톤 비활성 상태에서는 리셋 버튼이 없다', () => {
      render(<App />)
      expect(screen.queryByTestId('keystone-reset-btn')).not.toBeInTheDocument()
    })

    it('키스톤 활성 시 리셋 버튼이 나타난다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('keystone-btn'))
      expect(screen.getByTestId('keystone-reset-btn')).toBeInTheDocument()
    })

    it('키스톤 리셋 버튼 클릭 시 에러가 발생하지 않는다', () => {
      render(<App />)
      fireEvent.click(screen.getByTestId('keystone-btn'))
      expect(() => fireEvent.click(screen.getByTestId('keystone-reset-btn'))).not.toThrow()
    })
  })

  describe('온보딩 오버레이', () => {
    it('onboarding 플래그 없을 때 온보딩 오버레이가 표시된다', () => {
      localStorage.removeItem('projection-art-onboarded')
      render(<App />)
      expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument()
    })

    it('onboarding 플래그 있으면 온보딩 오버레이가 없다', () => {
      render(<App />)
      expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument()
    })

    it('시작하기 버튼 클릭 시 온보딩이 닫힌다', () => {
      localStorage.removeItem('projection-art-onboarded')
      render(<App />)
      fireEvent.click(screen.getByTestId('onboarding-start-btn'))
      expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument()
    })

    it('온보딩 닫히면 localStorage에 플래그가 저장된다', () => {
      localStorage.removeItem('projection-art-onboarded')
      render(<App />)
      fireEvent.click(screen.getByTestId('onboarding-start-btn'))
      expect(localStorage.getItem('projection-art-onboarded')).toBe('1')
    })
  })
})
