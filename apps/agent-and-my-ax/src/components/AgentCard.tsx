import Link from 'next/link';
import { CheckCircle2, MessageCircle, GitFork, Play } from 'lucide-react';
import { categoryColors, categoryLabels, findUser, visibilityLabels } from '@/data/mock';
import type { AgentItem } from '@/types';

interface AgentCardProps {
  agent: AgentItem;
  liked: boolean;
  onLike: () => void;
}

export default function AgentCard({ agent, liked, onLike }: AgentCardProps) {
  const creator = findUser(agent.creatorId);
  const categoryColor = categoryColors[agent.category];

  return (
    <article className="flex gap-3 border-b border-slate-100 bg-white p-4 last:border-b-0 md:items-center md:gap-4 md:p-5">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        className={`flex w-11 flex-none flex-col items-center justify-center rounded-xl border py-2 text-xs font-extrabold transition focus-ring ${
          liked
            ? 'border-[#B8EEDB] bg-[#E6F8F1] text-[#0C7A59]'
            : 'border-slate-200 bg-white text-slate-600 hover:border-[#B8EEDB] hover:bg-[#F3FCF8]'
        }`}
      >
        <span className="text-[10px] leading-none">▲</span>
        <span>{agent.likes + (liked ? 1 : 0)}</span>
      </button>

      <div
        className="hidden h-11 w-11 flex-none items-center justify-center rounded-xl text-xs font-extrabold md:flex"
        style={{ background: `${categoryColor}18`, color: categoryColor }}
      >
        AX
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <Link href={`/agent/${agent.id}`} className="min-w-0 focus-ring rounded-md">
            <h2 className="clamp-1 text-[15px] font-bold tracking-normal text-ink md:text-base">
              {agent.title}
            </h2>
          </Link>
          {agent.badge && (
            <span className="flex-none rounded-full bg-[#E6F8F1] px-2 py-0.5 text-[10px] font-bold text-[#0C7A59]">
              {agent.badge}
            </span>
          )}
        </div>
        <p className="clamp-2 mb-2 text-xs leading-5 text-slate-500 md:clamp-1">{agent.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: categoryColor }} />
            {categoryLabels[agent.category]}
          </span>
          <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-slate-600">
            {agent.platform}
          </span>
          <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-slate-600">
            {visibilityLabels[agent.visibility]}
          </span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold"
            style={{ background: creator.avatarBg, color: creator.avatarFg }}
          >
            {creator.name.charAt(0)}
          </span>
          <span className="text-slate-600">{creator.name}</span>
          <span>· {creator.team}</span>
          <span>· {agent.updatedAt}</span>
        </div>
      </div>

      <div className="hidden flex-none items-center gap-4 text-xs font-bold text-slate-500 lg:flex">
        <span className="inline-flex items-center gap-1">
          <MessageCircle size={15} />
          {agent.commentCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork size={15} />
          {agent.forkCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={15} />
          {agent.triedCount}
        </span>
        <Link
          href={`/agent/${agent.id}/run`}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-mint px-4 text-sm font-bold text-white transition hover:bg-[#0DAE7D] focus-ring"
        >
          <Play size={15} />
          Use
        </Link>
      </div>
    </article>
  );
}
