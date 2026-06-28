import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getQuestById } from '@/data/quests';
import StampBadge from '@/components/StampBadge';

const DIFFICULTY_LABEL = { easy: '쉬움 ●○○', medium: '보통 ●●○', hard: '어려움 ●●●' };
const CATEGORY_LABEL = {
  travel: '여행',
  challenge: '챌린지',
  learn: '배움',
  bonds: '인연',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuestDetailPage({ params }: Props) {
  const { id } = await params;
  const quest = getQuestById(id);
  if (!quest) notFound();

  const spotsLeft = quest.maxApplicants - quest.applicantCount;
  const canApply = quest.status === 'recruiting' || quest.status === 'closing';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[10px] text-ink/40 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">
          Quest Board
        </Link>
        <span>›</span>
        <span>{CATEGORY_LABEL[quest.category]}</span>
        <span>›</span>
        <span className="text-ink/60">{quest.subtitle.split('·')[1]?.trim()}</span>
      </div>

      {/* Dream Order Card */}
      <div
        className="relative bg-paper border border-ink/20 shadow-md"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* Top edge - torn paper */}
        <div className="absolute top-0 left-0 right-0 flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-t-2 border-ink/20"
              style={{ borderStyle: 'dashed' }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Label + Stamp */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[9px] text-ink/30 tracking-[0.3em] uppercase mb-1">
                Dream Order · 의뢰서
              </p>
              <p className="text-[11px] text-ink/50 tracking-widest font-mono">
                #{quest.id.toUpperCase()} · {CATEGORY_LABEL[quest.category]}
              </p>
            </div>
            <div className="stamp-animate">
              <StampBadge status={quest.status} size="md" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-ink mb-2 leading-snug">{quest.title}</h1>
          <p className="text-xs text-ink/40 tracking-widest font-mono mb-6">{quest.subtitle}</p>

          {/* Dashed divider */}
          <div className="divider-dashed mb-5" />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetaItem label="Reward · 보상" value={`${quest.reward.toLocaleString()}P`} highlight />
            <MetaItem label="Difficulty · 난이도" value={DIFFICULTY_LABEL[quest.difficulty]} />
            <MetaItem
              label="Applicants · 지원자"
              value={`${quest.applicantCount}명 지원 중 (잔여 ${spotsLeft}자리)`}
              warn={spotsLeft <= 1}
            />
            <MetaItem label="Deadline · 마감일" value={quest.deadline} />
          </div>

          {/* Dashed divider */}
          <div className="divider-dashed mb-5" />

          {/* Description */}
          <div className="mb-6">
            <p className="text-[10px] text-ink/40 tracking-widest uppercase mb-3">
              의뢰 내용 · Details
            </p>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {quest.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-6">
            {quest.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-ink/40 font-mono border border-ink/15 px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Dashed divider */}
          <div className="divider-dashed mb-5" />

          {/* Questioner */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[9px] text-ink/30 tracking-widest uppercase mb-1">의뢰인</p>
              <p className="text-sm font-bold text-ink">{quest.questioner}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-ink/30 tracking-widest uppercase mb-1">게시일</p>
              <p className="text-xs text-ink/60 font-mono">{quest.postedAt}</p>
            </div>
          </div>

          {/* CTA */}
          {canApply ? (
            <Link
              href={`/quest/${quest.id}/apply`}
              className="block w-full py-3 bg-primary text-white text-center text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-colors"
            >
              의뢰 지원하기 · Apply
            </Link>
          ) : (
            <div className="block w-full py-3 bg-ink/10 text-ink/40 text-center text-xs font-bold tracking-widest uppercase cursor-not-allowed">
              마감된 의뢰입니다
            </div>
          )}
        </div>

        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-b-2 border-ink/20"
              style={{ borderStyle: 'dashed' }}
            />
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/"
          className="text-[10px] text-ink/40 font-mono hover:text-primary transition-colors tracking-widest"
        >
          ← 게시판으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] text-ink/30 tracking-widest uppercase mb-1">{label}</p>
      <p
        className={`text-sm font-bold ${
          highlight ? 'text-primary' : warn ? 'text-stamp' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
