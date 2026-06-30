import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, GitFork, Heart, Sparkles } from 'lucide-react';
import { getUserActivity } from '@/server/agentService';
import type { AgentItem } from '@/types';

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const activity = getUserActivity(userId);
  if (!activity) notFound();

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
        <ArrowLeft size={16} />
        Home Feed
      </Link>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold"
              style={{ background: activity.user.avatarBg, color: activity.user.avatarFg }}
            >
              {activity.user.name.charAt(0)}
            </span>
            <div>
              <p className="text-2xl font-extrabold text-ink">{activity.user.name}</p>
              <p className="text-sm font-semibold text-slate-500">
                {activity.user.team} / {activity.user.role}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activity.user.bio}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 md:w-[360px]">
            <Metric icon={<Sparkles size={15} />} label="작성" value={activity.authoredAgents.length} />
            <Metric icon={<CheckCircle2 size={15} />} label="사용" value={activity.triedAgents.length} />
            <Metric icon={<Heart size={15} />} label="좋아요" value={activity.likedAgents.length} />
            <Metric icon={<GitFork size={15} />} label="Fork" value={activity.forkedAgents.length} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-extrabold text-ink">작성한 Agent</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-hairline">
            {activity.authoredAgents.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {activity.authoredAgents.map((agent) => (
                  <ProfileAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <Empty title="작성한 Agent가 없습니다" description="새 Agent를 등록하면 이곳에 표시됩니다." href="/agent/new" action="새 Agent 등록" />
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <ActivityList title="써봤어요" agents={activity.triedAgents} />
          <ActivityList title="좋아요" agents={activity.likedAgents} />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
            <p className="mb-3 text-sm font-extrabold text-ink">요청한 Agent</p>
            {activity.requests.length > 0 ? (
              <div className="space-y-3">
                {activity.requests.map((request) => (
                  <article key={request.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-extrabold text-ink">{request.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{request.status} · {request.votes} votes</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">아직 요청한 Agent가 없습니다.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileAgentCard({ agent }: { agent: AgentItem }) {
  return (
    <Link href={`/agent/${agent.id}`} className="block rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 focus-ring">
      <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-extrabold text-slate-500">
        <span className="rounded-full bg-white px-2 py-1">{agent.platform}</span>
        <span className="rounded-full bg-white px-2 py-1">{agent.visibility}</span>
      </div>
      <p className="text-base font-extrabold text-ink">{agent.title}</p>
      <p className="clamp-2 mt-2 text-sm leading-6 text-slate-600">{agent.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
        <span>좋아요 {agent.likes}</span>
        <span>써봤어요 {agent.triedCount}</span>
        <span>Fork {agent.forkCount}</span>
      </div>
    </Link>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0C7A59]">{icon}</div>
      <p className="text-lg font-extrabold text-ink">{value}</p>
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
    </div>
  );
}

function ActivityList({ title, agents }: { title: string; agents: Array<{ id: string; title: string; description: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
      <p className="mb-3 text-sm font-extrabold text-ink">{title}</p>
      {agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agent/${agent.id}`} className="block rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 focus-ring">
              <p className="text-sm font-extrabold text-ink">{agent.title}</p>
              <p className="clamp-2 mt-1 text-xs leading-5 text-slate-500">{agent.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">아직 활동이 없습니다.</p>
      )}
    </div>
  );
}

function Empty({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <div className="p-10 text-center">
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <Link href={href} className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-extrabold text-white focus-ring">
        {action}
      </Link>
    </div>
  );
}
