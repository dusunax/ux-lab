import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase-admin';
import type { FirestoreQuest } from '@/types/quest';
import ApplyForm from './ApplyForm';

async function getQuest(id: string): Promise<FirestoreQuest | null> {
  const doc = await adminDb.collection('quests').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title ?? '',
    subtitle: data.subtitle ?? `Dream Order · 의뢰 #${doc.id.slice(-3)}`,
    category: data.category ?? 'challenge',
    status: data.status ?? 'recruiting',
    reward: data.reward ?? 0,
    difficulty: data.difficulty ?? 'medium',
    applicantCount: data.applicantCount ?? 0,
    maxApplicants: data.maxApplicants ?? 1,
    deadline: data.deadline ?? '',
    description: data.description ?? '',
    questioner: data.questioner ?? '익명',
    postedAt:
      data.postedAt?.toDate?.()?.toISOString().split('T')[0] ??
      new Date().toISOString().split('T')[0],
    tags: data.tags ?? [],
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;
  const quest = await getQuest(id);
  if (!quest) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-[10px] text-ink/40 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">Quest Board</Link>
        <span>›</span>
        <Link href={`/quest/${id}`} className="hover:text-primary transition-colors">
          {quest.title}
        </Link>
        <span>›</span>
        <span className="text-ink/60">지원서</span>
      </div>

      <div className="mb-6" style={{ fontFamily: 'Georgia, serif' }}>
        <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1">
          Application Form · 지원서
        </p>
        <h1 className="text-xl font-bold text-ink mb-1">{quest.title}</h1>
        <p className="text-xs text-ink/40 font-mono">{quest.subtitle}</p>
      </div>

      <ApplyForm quest={quest} />

      <div className="mt-4">
        <Link href={`/quest/${id}`} className="text-[10px] text-ink/40 font-mono hover:text-primary transition-colors tracking-widest">
          ← 의뢰 상세로 돌아가기
        </Link>
      </div>
    </div>
  );
}
