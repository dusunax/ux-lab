'use client';

import { useState } from 'react';
import { QUESTS, type QuestCategory } from '@/data/quests';
import CategoryTab from '@/components/CategoryTab';
import QuestCard from '@/components/QuestCard';

export default function QuestBoardPage() {
  const [activeCategory, setActiveCategory] = useState<QuestCategory>('all');

  const filtered = activeCategory === 'all'
    ? QUESTS
    : QUESTS.filter((q) => q.category === activeCategory);

  return (
    <div>
      {/* Board Header */}
      <div className="mb-6">
        <p
          className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Quest Board · 의뢰 게시판
        </p>
        <h1 className="text-2xl font-bold text-ink mb-1">오늘의 의뢰</h1>
        <p className="text-sm text-ink/50">
          누군가의 버킷리스트를 대신 이뤄주세요. {QUESTS.length}개의 의뢰가 기다리고 있어요.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-5">
        <CategoryTab active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* Quest List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink/40 font-serif">해당 카테고리에 의뢰가 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-[10px] text-ink/30 font-mono text-right mt-4">
        {filtered.length} / {QUESTS.length} quests
      </p>
    </div>
  );
}
