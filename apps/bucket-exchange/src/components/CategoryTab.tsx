'use client';

import type { QuestCategory } from '@/types/quest';

const CATEGORIES: { value: QuestCategory; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'travel', label: 'TRAVEL' },
  { value: 'challenge', label: 'CHALLENGE' },
  { value: 'learn', label: 'LEARN' },
  { value: 'bonds', label: 'BONDS' },
];

interface Props {
  active: QuestCategory;
  onChange: (cat: QuestCategory) => void;
}

export default function CategoryTab({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`px-3 py-1.5 text-xs font-bold tracking-widest border transition-colors ${
            active === cat.value
              ? 'bg-primary text-white border-primary'
              : 'bg-paper text-ink/60 border-ink/20 hover:border-primary/50 hover:text-primary'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
