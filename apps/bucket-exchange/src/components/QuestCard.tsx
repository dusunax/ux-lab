import Link from 'next/link';
import type { FirestoreQuest } from '@/types/quest';
import StampBadge from './StampBadge';

interface Props {
  quest: FirestoreQuest;
}

const DIFFICULTY_LABEL = { easy: '쉬움', medium: '보통', hard: '어려움' };
const CATEGORY_LABEL = {
  travel: '여행',
  challenge: '챌린지',
  learn: '배움',
  bonds: '인연',
};

export default function QuestCard({ quest }: Props) {
  const spotsLeft = quest.maxApplicants - quest.applicantCount;

  return (
    <Link href={`/quest/${quest.id}`} className="block group">
      <div className="bg-paper border border-ink/10 p-5 hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden">
        {/* Torn paper top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 6px, #2F2F2F 6px, #2F2F2F 7px)',
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-ink/40 tracking-widest font-mono mb-1 uppercase">
              {CATEGORY_LABEL[quest.category]} · {quest.subtitle?.split('·')[1]?.trim()}
            </p>
            <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {quest.title}
            </h3>
          </div>
          <StampBadge status={quest.status} size="sm" />
        </div>

        {/* Description */}
        <p className="text-xs text-ink/60 leading-relaxed line-clamp-2 mb-4 font-serif">
          {quest.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-dashed border-ink/15">
          <div className="flex gap-3 text-[10px] text-ink/50 font-mono">
            <span>난이도 {DIFFICULTY_LABEL[quest.difficulty]}</span>
            <span>·</span>
            <span>
              지원 {quest.applicantCount}/{quest.maxApplicants}명
              {spotsLeft <= 1 && spotsLeft > 0 && (
                <span className="text-stamp ml-1">(마감 임박)</span>
              )}
            </span>
          </div>
          <div className="text-xs font-bold text-primary">
            {quest.reward.toLocaleString()}P
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap mt-2">
          {(quest.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] text-ink/40 font-mono tracking-wide"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Questioner */}
        <p className="text-[10px] text-ink/30 font-mono mt-2 text-right">
          by {quest.questioner} · {quest.postedAt}
        </p>
      </div>
    </Link>
  );
}
