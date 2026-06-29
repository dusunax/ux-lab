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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
      <div className="grid grid-cols-2 gap-1.5">
        {downloads.map((asset) => (
          <button
            key={asset.kind}
            type="button"
            onClick={() => downloadAsset(asset)}
            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-ink transition hover:bg-slate-50 focus-ring"
          >
            <Download size={14} />
            <span className="min-w-0 truncate">{asset.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setIsGuideOpen((value) => !value)}
          aria-expanded={isGuideOpen}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50 focus-ring"
        >
          <span className="inline-flex min-w-0 items-center gap-2 text-xs font-extrabold text-ink">
            <FileText size={14} className="text-mint" />
            <span className="truncate">다운로드 가이드</span>
          </span>
          <ChevronDown
            size={15}
            className={`flex-none text-slate-400 transition ${isGuideOpen ? 'rotate-180 text-mint' : ''}`}
          />
        </button>
        {isGuideOpen && (
          <div className="grid gap-1.5 border-t border-slate-100 bg-slate-50 p-2">
            {downloads.map((asset) => {
              const guide = guideDetails[asset.kind];
              return (
                <article key={`${asset.kind}-guide`} className="min-w-0 rounded-md border border-slate-100 bg-white px-2.5 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex-none text-[11px] font-extrabold text-ink">{asset.label}</span>
                    <span className="min-w-0 break-words text-right text-[10px] font-bold leading-4 text-slate-400">
                      {asset.filename}
                    </span>
                  </div>
                  <GuideRow label="넣는 곳" value={guide.placement} />
                  <GuideRow label="사용법" value={guide.usage} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-[11px] leading-4 text-slate-500">
      <span className="w-10 flex-none font-extrabold text-slate-600">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
