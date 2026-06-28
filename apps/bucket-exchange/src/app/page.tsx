import { adminDb } from '@/lib/firebase-admin';
import type { FirestoreQuest } from '@/types/quest';
import QuestBoardClient from '@/components/QuestBoardClient';

async function getQuests(): Promise<FirestoreQuest[]> {
  const snap = await adminDb
    .collection('quests')
    .orderBy('postedAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
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
    } satisfies FirestoreQuest;
  });
}

export default async function QuestBoardPage() {
  const quests = await getQuests();

  return (
    <div>
      <div className="mb-6">
        <p
          className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Quest Board · 의뢰 게시판
        </p>
        <h1 className="text-2xl font-bold text-ink mb-1">오늘의 의뢰</h1>
        <p className="text-sm text-ink/50">
          누군가의 버킷리스트를 대신 이뤄주세요.{' '}
          {quests.length > 0 ? `${quests.length}개의 의뢰가 기다리고 있어요.` : '첫 의뢰를 등록해보세요.'}
        </p>
      </div>

      <QuestBoardClient quests={quests} />
    </div>
  );
}
