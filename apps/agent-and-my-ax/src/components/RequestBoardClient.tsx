'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Plus, ThumbsUp } from 'lucide-react';
import type { AgentRequest, RequestStatus } from '@/types';

const statusLabels: Record<RequestStatus, string> = {
  open: '요청 접수',
  planned: '계획됨',
  'in-progress': '진행 중',
  shipped: '출시됨',
};

const statusStyles: Record<RequestStatus, string> = {
  open: 'bg-slate-100 text-slate-600',
  planned: 'bg-[#EEF2FF] text-[#4F46E5]',
  'in-progress': 'bg-[#E6F8F1] text-[#0C7A59]',
  shipped: 'bg-[#FEF3C7] text-[#B45309]',
};

export default function RequestBoardClient() {
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [title, setTitle] = useState('고객 미팅 후속 메일 Agent');
  const [description, setDescription] = useState('미팅 메모와 액션 아이템을 넣으면 고객에게 보낼 후속 메일 초안을 작성해주는 Agent가 필요합니다.');
  const [team, setTeam] = useState('Sales');
  const [tagText, setTagText] = useState('Meeting, Email, Sales');
  const [error, setError] = useState('');

  const loadRequests = () => {
    fetch('/api/requests')
      .then((response) => response.json())
      .then((payload: { requests?: AgentRequest[] }) => setRequests(payload.requests ?? []))
      .catch(() => setError('요청 목록을 불러오지 못했습니다.'));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const tags = tagText.split(',').map((tag) => tag.trim()).filter(Boolean);
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, team, tags }),
    });
    const payload = await response.json() as { request?: AgentRequest; error?: string };
    if (!response.ok || !payload.request) {
      setError(payload.error ?? '요청 등록에 실패했습니다.');
      return;
    }
    setRequests((current) => [payload.request!, ...current]);
    setTitle('');
    setDescription('');
    setTagText('');
  };

  const vote = async (id: string) => {
    const response = await fetch(`/api/requests/${id}/vote`, { method: 'POST' });
    const payload = await response.json() as { request?: AgentRequest };
    if (!payload.request) return;
    setRequests((current) => current.map((request) => (request.id === id ? payload.request! : request)));
  };

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
        <ArrowLeft size={16} />
        Home Feed
      </Link>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">Request Board</p>
          <h1 className="text-2xl font-extrabold tracking-normal text-ink md:text-3xl">필요한 Agent를 요청하세요</h1>
        </div>
        <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-500 shadow-hairline">
          전체 공개 요청만 허용
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="grid gap-3">
            {requests.length > 0 ? requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{request.team} · {request.createdAt}</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-ink">{request.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => vote(request.id)}
                    className="inline-flex h-9 flex-none items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-extrabold text-ink transition hover:bg-slate-50 focus-ring"
                  >
                    <ThumbsUp size={15} />
                    {request.votes}
                  </button>
                </div>
                <p className="mb-3 text-sm leading-6 text-slate-600">{request.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {request.tags.map((tag) => (
                    <span key={`${request.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            )) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-hairline">
                <ClipboardList className="mx-auto mb-3 text-slate-300" size={28} />
                <p className="text-sm font-bold text-ink">아직 요청이 없습니다</p>
                <p className="mt-1 text-sm text-slate-500">첫 번째 Agent 요청을 등록해보세요.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-ink">
            <Plus size={16} className="text-mint" />
            새 요청
          </div>
          <form onSubmit={create} className="space-y-3">
            <Field label="요청 제목" value={title} onChange={setTitle} />
            <Field label="팀" value={team} onChange={setTeam} />
            <Field label="태그" value={tagText} onChange={setTagText} />
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-ink">설명</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </label>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-mint text-sm font-extrabold text-white transition hover:bg-[#0DAE7D] focus-ring">
              요청 등록
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-extrabold text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mint"
      />
    </label>
  );
}
