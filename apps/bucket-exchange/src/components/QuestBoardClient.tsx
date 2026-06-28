'use client';

import { useState } from 'react';
import type { QuestCategory } from '@/data/quests';
import CategoryTab from './CategoryTab';
import QuestCard from './QuestCard';
import type { FirestoreQuest } from '@/types/quest';

interface Props {
  quests: FirestoreQuest[];
}

export default function QuestBoardClient({ quests }: Props) {
  const [activeCategory, setActiveCategory] = useState<QuestCategory>('all');

  const filtered =
    activeCategory === 'all'
      ? quests
      : quests.filter((q) => q.category === activeCategory);

  return (
    <>
      <div className="mb-5">
        <CategoryTab active={activeCategory} onChange={setActiveCategory} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink/40 font-serif">
            {quests.length === 0
              ? '아직 등록된 의뢰가 없어요. 첫 의뢰를 등록해보세요!'
              : '해당 카테고리에 의뢰가 없어요.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-ink/30 font-mono text-right mt-4">
        {filtered.length} / {quests.length} quests
      </p>
    </>
  );
}
