// figma-harness 검증 전용 스크래치 — 커맨드가 매 실행마다 덮어씀
// (.agent/skills/FIGMA_HARNESS_CORE.md §7.2 참조. 이 파일은 버저닝 대상이 아님)
'use client'

import ComposeButton from '../components/ComposeButton'

export default function PreviewPage() {
  return (
    <div
      data-verify-root
      className="min-h-screen flex items-center justify-center bg-[#f4f6fb] p-8 font-nunito"
    >
      <ComposeButton />
    </div>
  )
}
