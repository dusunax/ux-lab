'use client';

import { useState } from 'react';
import { ChevronDown, Download, FileText } from 'lucide-react';
import type { AgentDownloadAsset } from '@/types';

interface AgentDownloadButtonsProps {
  downloads: AgentDownloadAsset[];
}

const guideDetails: Record<AgentDownloadAsset['kind'], { placement: string; usage: string }> = {
  cursor: {
    placement: '.cursor/rules 또는 Cursor Chat 컨텍스트',
    usage: '관련 코드와 문서를 열어둔 상태에서 프로젝트 규칙처럼 사용하세요.',
  },
  claude: {
    placement: 'Claude Project Instructions, Claude Code 지시문, CLAUDE.md',
    usage: '프로젝트 지시문에 넣고, 분석할 원본 입력을 마지막에 붙이세요.',
  },
  codex: {
    placement: 'Codex 작업 지시, AGENTS.md, PR/이슈 컨텍스트',
    usage: '수정 대상 파일과 검증 명령을 함께 제공하면 더 안정적으로 동작합니다.',
  },
  prompt: {
    placement: 'ChatGPT, Claude, Gen.AI 등 일반 채팅 입력창',
    usage: '도구에 묶이지 않는 범용 프롬프트로, 원본 입력을 이어서 넣으세요.',
  },
};

export default function AgentDownloadButtons({ downloads }: AgentDownloadButtonsProps) {
  const [openKind, setOpenKind] = useState<AgentDownloadAsset['kind']>(downloads[0]?.kind ?? 'prompt');

  const downloadAsset = (asset: AgentDownloadAsset) => {
    const blob = new Blob([asset.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {downloads.map((asset) => (
          <button
            key={asset.kind}
            type="button"
            onClick={() => downloadAsset(asset)}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-ink transition hover:bg-slate-50 focus-ring"
          >
            <Download size={14} />
            <span className="min-w-0 truncate">{asset.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-3 py-2">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold text-ink">
            <FileText size={14} className="text-mint" />
            다운로드 가이드
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {downloads.map((asset) => {
            const isOpen = openKind === asset.kind;
            const guide = guideDetails[asset.kind];
            return (
              <section key={`${asset.kind}-guide`}>
                <button
                  type="button"
                  onClick={() => setOpenKind(asset.kind)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white focus-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold text-ink">{asset.label}</span>
                    <span className="clamp-1 text-[11px] font-semibold text-slate-400">{guide.placement}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-none text-slate-400 transition ${isOpen ? 'rotate-180 text-mint' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="grid gap-2 bg-white px-3 pb-3 text-xs leading-5 text-slate-500">
                    <GuideRow label="넣는 곳" value={guide.placement} />
                    <GuideRow label="사용법" value={guide.usage} />
                    <GuideRow label="파일명" value={asset.filename} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <span className="mr-2 font-extrabold text-slate-600">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );
}
