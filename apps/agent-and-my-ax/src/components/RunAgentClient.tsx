'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { findUser, visibilityLabels } from '@/data/mock';
import type { AgentItem, RunAgentResult, RunArtifact } from '@/types';

interface RunAgentClientProps {
  agent: AgentItem;
}

export default function RunAgentClient({ agent }: RunAgentClientProps) {
  const creator = findUser(agent.creatorId);
  const [input, setInput] = useState(agent.sampleInput);
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<RunAgentResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);

  const runAgent = async () => {
    setRunning(true);
    setError('');
    try {
      const response = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const payload = (await response.json()) as { result?: RunAgentResult; error?: string };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? 'Run failed');
      }
      setResult(payload.result);
      setHasRun(true);
    } catch {
      setError('실행에 실패했습니다. 입력을 확인하고 다시 시도해주세요.');
    } finally {
      setRunning(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.copyText);
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

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:order-none">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold"
                style={{ background: creator.avatarBg, color: creator.avatarFg }}
              >
                AX
              </span>
              <div className="min-w-0">
                <p className="clamp-1 font-bold text-ink">{agent.title}</p>
                <p className="text-xs font-semibold text-slate-400">by {creator.name}</p>
              </div>
            </div>
            <Link
              href={`/agent/${agent.id}`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-ink transition hover:bg-slate-50 focus-ring"
            >
              Agent 정보 보기
            </Link>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center justify-between gap-3">
                <span>Platform</span>
                <span className="text-ink">{agent.platform}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Visibility</span>
                <span className="text-ink">{visibilityLabels[agent.visibility]}</span>
              </div>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline lg:block">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">최근 실행</p>
            <div className="space-y-3">
              {['1월 정기회의 회의록', 'Agent Hub 킥오프', '랭킹 정책 회의'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-mint" />
                  <p className="clamp-1 text-sm font-semibold text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline md:p-7">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold text-slate-400">Run Agent</p>
              <h1 className="text-2xl font-extrabold tracking-normal text-ink">{agent.title}</h1>
            </div>
            {hasRun && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F8F1] px-3 py-1 text-xs font-extrabold text-[#0C7A59]">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                실행 완료
              </span>
            )}
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
            onClick={runAgent}
            disabled={!input.trim() || running}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint text-sm font-extrabold text-white transition hover:bg-[#0DAE7D] disabled:cursor-not-allowed disabled:opacity-40 focus-ring sm:w-auto sm:px-6"
          >
            <Play size={17} />
            {running ? 'Running...' : 'Run'}
          </button>
          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

          {hasRun && result ? (
            <ResultPanel
              copied={copied}
              inputSummary={result.inputSummary}
              output={result.copyText}
              resultTitle={result.resultTitle}
              resultCountLabel={result.resultCountLabel}
              primaryActionLabel={result.primaryActionLabel}
              steps={result.steps}
              artifacts={result.artifacts}
              tried={tried}
              triedCount={agent.triedCount + (tried ? 1 : 0)}
              onCopy={copyResult}
              onReset={() => {
                setHasRun(false);
                setResult(null);
              }}
              onTried={() => setTried((value) => !value)}
            />
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
                <Sparkles size={17} className="text-mint" />
                결과 미리보기
              </div>
              <p className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-400">
                Run을 누르면 입력 요약, 처리 단계, 결과 카드, 후속 CTA가 공통 결과 페이지 형태로 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ResultPanel({
  copied,
  inputSummary,
  output,
  resultTitle,
  resultCountLabel,
  primaryActionLabel,
  steps,
  artifacts,
  tried,
  triedCount,
  onCopy,
  onReset,
  onTried,
}: {
  copied: boolean;
  inputSummary: string;
  output: string;
  resultTitle: string;
  resultCountLabel: string;
  primaryActionLabel: string;
  steps: RunAgentResult['steps'];
  artifacts: RunArtifact[];
  tried: boolean;
  triedCount: number;
  onCopy: () => void;
  onReset: () => void;
  onTried: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-ink">입력 요약</h2>
          <span className="text-xs font-bold text-[#0C7A59]">요약됨</span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{inputSummary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-hairline">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-ink">
              <CheckCircle2 size={16} className="text-mint" />
              {step.title}
            </div>
            <p className="text-xs leading-5 text-slate-500">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink">
            {resultTitle} <span className="text-mint">{resultCountLabel}</span>
          </h2>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-ring"
          >
            <Copy size={14} />
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <article key={artifact.title} className="rounded-xl border border-slate-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-sm font-extrabold leading-5 text-ink">{artifact.title}</h3>
                <span className="flex-none rounded-md bg-[#E6F8F1] px-2 py-1 text-[11px] font-extrabold text-[#0C7A59]">
                  {artifact.badge}
                </span>
              </div>
              <p className="mb-2 text-sm leading-6 text-slate-600">{artifact.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                {artifact.meta.map((item) => (
                  <span key={`${artifact.title}-${item.label}`}>
                    {item.label} <b className="text-slate-600">{item.value}</b>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <pre className="sr-only">{output}</pre>
        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-ink transition hover:bg-slate-50 focus-ring"
        >
          <ExternalLink size={16} />
          {primaryActionLabel}
        </button>
      </div>

      <div className="rounded-2xl border border-[#BDEBDA] bg-[#E6F8F1] p-5">
        <h2 className="mb-1 text-sm font-extrabold text-ink">이 결과가 도움이 됐나요?</h2>
        <p className="mb-4 text-sm leading-6 text-[#0C7A59]">
          써봤어요를 남기면 Agent 랭킹과 개선 우선순위에 반영됩니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onTried}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition focus-ring ${
              tried ? 'bg-ink text-white' : 'bg-mint text-white hover:bg-[#0DAE7D]'
            }`}
          >
            <CheckCircle2 size={17} />
            써봤어요 {triedCount}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#BDEBDA] bg-white text-sm font-extrabold text-ink transition hover:bg-slate-50 focus-ring"
          >
            <RotateCcw size={17} />
            다시 실행
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-hairline">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
          다른 입력으로 다시 실행...
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-mint text-white transition hover:bg-[#0DAE7D] focus-ring"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
