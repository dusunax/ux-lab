'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, GitFork, MessageCircle, Play, ThumbsUp } from 'lucide-react';
import { categoryColors, categoryLabels, findUser, visibilityLabels } from '@/data/mock';
import type { AgentComment, AgentInteractionKind, AgentItem } from '@/types';
import AgentDownloadButtons from './AgentDownloadButtons';

interface AgentDetailClientProps {
  agent: AgentItem;
  initialComments: AgentComment[];
}

export default function AgentDetailClient({ agent, initialComments }: AgentDetailClientProps) {
  const creator = findUser(agent.creatorId);
  const [liked, setLiked] = useState(false);
  const [forked, setForked] = useState(false);
  const [tried, setTried] = useState(false);
  const [metrics, setMetrics] = useState({
    likes: agent.likes,
    triedCount: agent.triedCount,
    forkCount: agent.forkCount,
  });
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<AgentComment[]>(initialComments);
  const categoryColor = categoryColors[agent.category];

  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    const response = await fetch(`/api/agents/${agent.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const payload = (await response.json()) as { comment?: AgentComment };
    if (response.ok && payload.comment) {
      setComments((current) => [payload.comment!, ...current]);
      setCommentText('');
    }
  };

  const updateInteraction = async (kind: AgentInteractionKind, active: boolean) => {
    const response = await fetch(`/api/agents/${agent.id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, active }),
    });
    const payload = (await response.json()) as { agent?: AgentItem };
    if (response.ok && payload.agent) {
      setMetrics({
        likes: payload.agent.likes,
        triedCount: payload.agent.triedCount,
        forkCount: payload.agent.forkCount,
      });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-hairline">
        <div className="border-b border-slate-100 p-5 md:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold"
              style={{ color: categoryColor }}
            >
              {categoryLabels[agent.category]}
            </span>
            <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
              {agent.platform}
            </span>
            <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
              {visibilityLabels[agent.visibility]}
            </span>
            {agent.badge && (
              <span className="rounded-full bg-[#E6F8F1] px-2.5 py-1 text-xs font-bold text-[#0C7A59]">
                {agent.badge}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">Updated {agent.updatedAt}</span>
          </div>
          <h1 className="mb-3 text-2xl font-extrabold tracking-normal text-ink md:text-3xl">{agent.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">{agent.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {agent.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 p-5 md:p-7">
          <InfoBlock title="Usage Guide">
            <p className="rounded-xl border border-[#BDEBDA] bg-[#E6F8F1] p-4 text-sm leading-6 text-[#0C7A59]">
              {agent.usageGuide}
            </p>
          </InfoBlock>

          <InfoBlock title="사용 방법">
            <ol className="grid gap-2">
              {agent.usage.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-ink">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </InfoBlock>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock title="입력 예시">
              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{agent.sampleInput}</p>
            </InfoBlock>
            <InfoBlock title="출력 예시">
              <p className="rounded-xl bg-[#F3FCF8] p-4 text-sm leading-6 text-[#0C7A59]">{agent.sampleOutput}</p>
            </InfoBlock>
          </div>

          <InfoBlock title="업데이트 이력">
            <div className="grid gap-2">
              {agent.history.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                  {item}
                </div>
              ))}
            </div>
          </InfoBlock>

          <InfoBlock title={`댓글 ${comments.length}`}>
            <form onSubmit={addComment} className="mb-4 flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="활용 팁이나 개선 의견을 남겨보세요"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-ring"
              >
                등록
              </button>
            </form>
            <div className="grid gap-3">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{comment.author}</p>
                      <p className="text-xs text-slate-400">{comment.team}</p>
                    </div>
                    <span className="flex-none text-xs font-semibold text-slate-400">{comment.createdAt}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{comment.content}</p>
                </article>
              ))}
            </div>
          </InfoBlock>
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
          <p className="mb-4 text-sm leading-6 text-slate-600">{creator.bio}</p>
          <Link
            href={`/agent/${agent.id}/run`}
            className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint text-sm font-extrabold text-white transition hover:bg-[#0DAE7D] focus-ring"
          >
            <Play size={17} />
            실행하기
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              active={liked}
              onClick={() => {
                const active = !liked;
                setLiked(active);
                void updateInteraction('likes', active);
              }}
              icon={<ThumbsUp size={15} />}
              label={String(metrics.likes)}
            />
            <ActionButton
              active={tried}
              onClick={() => {
                const active = !tried;
                setTried(active);
                void updateInteraction('tried', active);
              }}
              icon={<CheckCircle2 size={15} />}
              label={String(metrics.triedCount)}
            />
            <ActionButton
              active={forked}
              onClick={() => {
                const active = !forked;
                setForked(active);
                void updateInteraction('forks', active);
              }}
              icon={<GitFork size={15} />}
              label={String(metrics.forkCount)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
          <p className="mb-3 text-sm font-extrabold text-ink">지표</p>
          <Metric icon={<Play size={15} />} label="Platform" value={agent.platform} />
          <Metric icon={<CheckCircle2 size={15} />} label="공개 범위" value={visibilityLabels[agent.visibility]} />
          <Metric icon={<MessageCircle size={15} />} label="댓글" value={String(comments.length)} />
          <Metric icon={<CheckCircle2 size={15} />} label="써봤어요" value={String(metrics.triedCount)} />
          <Metric icon={<GitFork size={15} />} label="Fork" value={String(metrics.forkCount)} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
          <p className="mb-2 text-sm font-extrabold text-ink">다운로드</p>
          <p className="mb-4 text-xs leading-5 text-slate-500">
            작성자가 준비한 실행 파일을 환경별로 내려받아 사용할 수 있습니다.
          </p>
          <AgentDownloadButtons downloads={agent.downloads} />
        </div>
      </aside>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function ActionButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-extrabold transition focus-ring ${
        active ? 'border-[#B8EEDB] bg-[#E6F8F1] text-[#0C7A59]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-3 text-sm">
      <span className="inline-flex items-center gap-2 font-semibold text-slate-500">
        {icon}
        {label}
      </span>
      <span className="font-extrabold text-ink">{value}</span>
    </div>
  );
}
