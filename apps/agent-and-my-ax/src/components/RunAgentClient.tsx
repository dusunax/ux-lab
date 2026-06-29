'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, Play } from 'lucide-react';
import { findUser } from '@/data/mock';
import type { AgentItem } from '@/types';

interface RunAgentClientProps {
  agent: AgentItem;
}

export default function RunAgentClient({ agent }: RunAgentClientProps) {
  const creator = findUser(agent.creatorId);
  const [input, setInput] = useState(agent.sampleInput);
  const [hasRun, setHasRun] = useState(false);
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const compactInput = input.trim().slice(0, 80);
    return `${agent.sampleOutput}\n\n입력 요약: ${compactInput || '입력 없음'}${input.trim().length > 80 ? '...' : ''}`;
  }, [agent.sampleOutput, input]);

  const copyResult = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div>
      <div className="mb-4">
        <Link href={`/agent/${agent.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
          <ArrowLeft size={16} />
          상세로 돌아가기
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline md:p-7">
          <div className="mb-5">
            <p className="mb-1 text-xs font-bold text-slate-400">Run Agent</p>
            <h1 className="text-2xl font-extrabold tracking-normal text-ink">{agent.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{agent.description}</p>
          </div>

          <label className="mb-2 block text-sm font-extrabold text-ink">{agent.runLabel}</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={agent.runPlaceholder}
            rows={9}
            className="mb-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint"
          />
          <button
            type="button"
            onClick={() => setHasRun(true)}
            disabled={!input.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint text-sm font-extrabold text-white transition hover:bg-[#0DAE7D] disabled:cursor-not-allowed disabled:opacity-40 focus-ring sm:w-auto sm:px-6"
          >
            <Play size={17} />
            Run
          </button>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold text-ink">결과</h2>
              {hasRun && (
                <button
                  type="button"
                  onClick={copyResult}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-ring"
                >
                  <Copy size={14} />
                  {copied ? '복사됨' : '복사'}
                </button>
              )}
            </div>
            {hasRun ? (
              <pre className="whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">{output}</pre>
            ) : (
              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-400">
                입력값을 확인한 뒤 Run을 누르면 mock 결과가 표시됩니다.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold"
                style={{ background: creator.avatarBg, color: creator.avatarFg }}
              >
                {creator.name.charAt(0)}
              </span>
              <div>
                <p className="font-bold text-ink">{creator.name}</p>
                <p className="text-xs font-semibold text-slate-400">
                  {creator.team} / {creator.role}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTried((value) => !value)}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-extrabold transition focus-ring ${
                tried ? 'border-[#B8EEDB] bg-[#E6F8F1] text-[#0C7A59]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={17} />
              {tried ? `써봤어요 ${agent.triedCount + 1}` : `써봤어요 ${agent.triedCount}`}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
            <p className="mb-3 text-sm font-extrabold text-ink">입력 예시</p>
            <p className="text-sm leading-6 text-slate-600">{agent.sampleInput}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
