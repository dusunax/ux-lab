'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import AgentCard from '@/components/AgentCard';
import { agents, categoryLabels } from '@/data/mock';
import type { AgentCategory, AgentItem } from '@/types';

const categoryOptions: Array<'all' | AgentCategory> = [
  'all',
  'productivity',
  'development',
  'planning',
  'analytics',
  'communication',
];

export default function HomeFeed() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | AgentCategory>('all');
  const [sort, setSort] = useState<'popular' | 'recent' | 'tried'>('popular');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [agentList, setAgentList] = useState<AgentItem[]>(agents);

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const selected = agentList.filter((agent) => {
      const matchesCategory = category === 'all' || agent.category === category;
      const haystack = [agent.title, agent.description, agent.platform, agent.visibility, ...agent.tags].join(' ').toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });

    return [...selected].sort((a, b) => {
      if (sort === 'recent') return b.updatedAt.localeCompare(a.updatedAt);
      if (sort === 'tried') return b.triedCount - a.triedCount;
      return b.likes - a.likes;
    });
  }, [agentList, category, query, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (query.trim()) params.set('q', query.trim());
    params.set('sort', sort);
    fetch(`/api/agents?${params.toString()}`)
      .then((response) => response.json())
      .then((payload: { agents?: AgentItem[] }) => {
        if (payload.agents) setAgentList(payload.agents);
      })
      .catch(() => {
        setAgentList(agents);
      });
  }, [category, query, sort]);

  const toggleLike = (id: string) => {
    setLikedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[222px_minmax(0,1fr)]">
      <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-hairline lg:block">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">카테고리</p>
        <div className="flex flex-col gap-1">
          {categoryOptions.map((option) => {
            const active = category === option;
            const label = option === 'all' ? '전체' : categoryLabels[option];
            const count = option === 'all' ? agentList.length : agentList.filter((agent) => agent.category === option).length;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition focus-ring ${
                  active ? 'bg-[#E6F8F1] font-bold text-ink' : 'font-semibold text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                <span className={active ? 'text-[#0C7A59]' : 'text-slate-400'}>{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-hairline">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 md:hidden">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Agent · 작성자 · 태그 검색"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="noscroll flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 lg:hidden">
            {categoryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`flex-none rounded-full px-3 py-1.5 text-sm font-bold transition focus-ring ${
                  category === option ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {option === 'all' ? `전체 ${agentList.length}` : categoryLabels[option]}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 px-4 py-3 md:flex lg:border-b lg:border-slate-100">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Agent · 작성자 · 태그 검색"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="text-ink">전체 Agent</span>
              <span className="hidden text-slate-400 sm:inline">내 팀</span>
              <span className="hidden text-slate-400 sm:inline">북마크</span>
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'popular' | 'recent' | 'tried')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-mint"
            >
              <option value="popular">인기순</option>
              <option value="recent">최신순</option>
              <option value="tried">써봤어요순</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-hairline">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                liked={likedIds.includes(agent.id)}
                onLike={() => toggleLike(agent.id)}
              />
            ))
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm font-bold text-ink">검색 결과가 없습니다</p>
              <p className="mt-1 text-sm text-slate-500">다른 키워드나 카테고리로 다시 찾아보세요.</p>
              <Link
                href="/agent/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 focus-ring"
              >
                <Plus size={16} />
                새 Agent 등록
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
