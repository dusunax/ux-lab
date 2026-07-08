'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { categoryLabels, visibilityLabels } from '@/data/mock';
import type { AgentCategory, AgentPlatform, AgentVisibility, CreateAgentInput } from '@/types';

const categories: AgentCategory[] = ['productivity', 'development', 'planning', 'analytics', 'communication'];
const platforms: AgentPlatform[] = ['ChatGPT', 'Claude', 'Gen.AI', 'Document.AI', 'Agent Builder'];
const visibilities: AgentVisibility[] = ['company', 'team', 'private'];

const initialForm: CreateAgentInput = {
  title: '릴리즈 노트 초안 Agent',
  description: 'PR 목록과 Jira 완료 항목을 고객용/내부용 릴리즈 노트로 나눠 정리합니다.',
  category: 'productivity',
  tags: ['Release', 'Jira', 'PR'],
  platform: 'Claude',
  usageGuide: '완료된 PR 제목, Jira 키, 고객 영향도를 함께 넣으면 더 정확하게 분류됩니다.',
  visibility: 'team',
  runLabel: '릴리즈 후보 목록',
  runPlaceholder: '완료된 PR과 Jira 항목을 붙여넣으세요...',
  sampleInput: 'PR #43 Agent Hub Sprint 1 merge / AX-12 결과 페이지 개선',
  sampleOutput: '고객용: Agent 결과 화면이 개선되었습니다. 내부용: 다운로드 가이드와 resultPreset 계약이 추가되었습니다.',
  prompt: '완료된 PR과 Jira 항목을 읽고 고객용 릴리즈 노트와 내부 공유 문안을 분리해 작성하세요.',
  resultTitle: '릴리즈 노트 초안',
  primaryActionLabel: '문서로 내보내기',
};

export default function CreateAgentClient() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAgentInput>(initialForm);
  const [tagText, setTagText] = useState(initialForm.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tags = useMemo(
    () => tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagText],
  );

  const update = <K extends keyof CreateAgentInput>(key: K, value: CreateAgentInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags }),
      });
      const payload = await response.json() as { agent?: { id: string }; error?: string };
      if (!response.ok || !payload.agent) {
        throw new Error(payload.error ?? '등록에 실패했습니다.');
      }
      router.push(`/agent/${payload.agent.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
          <ArrowLeft size={16} />
          Home Feed
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-500">Create Agent</p>
            <h1 className="text-2xl font-extrabold tracking-normal text-ink md:text-3xl">새 Agent 등록</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#BDEBDA] bg-[#E6F8F1] px-3 py-2 text-xs font-extrabold text-[#0C7A59]">
            <ShieldCheck size={16} />
            Google Workspace SSO mock
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Agent 이름" value={form.title} onChange={(value) => update('title', value)} />
            <Field label="태그" value={tagText} onChange={setTagText} placeholder="쉼표로 구분" />
            <SelectField label="카테고리" value={form.category} onChange={(value) => update('category', value as AgentCategory)} options={categories.map((item) => ({ value: item, label: categoryLabels[item] }))} />
            <SelectField label="Platform" value={form.platform} onChange={(value) => update('platform', value as AgentPlatform)} options={platforms.map((item) => ({ value: item, label: item }))} />
            <SelectField label="Visibility" value={form.visibility} onChange={(value) => update('visibility', value as AgentVisibility)} options={visibilities.map((item) => ({ value: item, label: visibilityLabels[item] }))} />
            <Field label="Run 입력 라벨" value={form.runLabel} onChange={(value) => update('runLabel', value)} />
          </div>

          <TextArea label="설명" value={form.description} onChange={(value) => update('description', value)} rows={3} />
          <TextArea label="Usage Guide" value={form.usageGuide} onChange={(value) => update('usageGuide', value)} rows={3} />
          <TextArea label="Prompt" value={form.prompt} onChange={(value) => update('prompt', value)} rows={4} />

          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="입력 예시" value={form.sampleInput} onChange={(value) => update('sampleInput', value)} rows={4} />
            <TextArea label="출력 예시" value={form.sampleOutput} onChange={(value) => update('sampleOutput', value)} rows={4} />
            <Field label="Run placeholder" value={form.runPlaceholder} onChange={(value) => update('runPlaceholder', value)} />
            <Field label="결과 제목" value={form.resultTitle} onChange={(value) => update('resultTitle', value)} />
            <Field label="주요 CTA" value={form.primaryActionLabel} onChange={(value) => update('primaryActionLabel', value)} />
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint text-sm font-extrabold text-white transition hover:bg-[#0DAE7D] disabled:opacity-50 focus-ring sm:w-auto sm:px-6"
          >
            <Save size={17} />
            {saving ? '등록 중...' : 'Agent 등록'}
          </button>
        </section>

        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
            <Eye size={16} className="text-mint" />
            미리보기
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-lg font-extrabold text-ink">{form.title || 'Agent 이름'}</p>
            <p className="mb-3 text-sm leading-6 text-slate-600">{form.description || '설명을 입력하세요.'}</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="space-y-2 text-xs font-semibold text-slate-500">
              <PreviewRow label="Platform" value={form.platform} />
              <PreviewRow label="Visibility" value={visibilityLabels[form.visibility]} />
              <PreviewRow label="Result" value={form.resultTitle} />
              <PreviewRow label="Downloads" value="Cursor · Claude · Codex · Prompt" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#BDEBDA] bg-[#E6F8F1] p-4 text-xs leading-5 text-[#0C7A59]">
            등록하면 mock repository에 저장되고, Detail/Run 화면에서 같은 resultPreset과 다운로드 UI가 재사용됩니다.
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mint"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="mt-4 grid gap-2">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-mint"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-mint"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
      <span>{label}</span>
      <span className="min-w-0 break-words text-right font-extrabold text-ink">{value}</span>
    </div>
  );
}
