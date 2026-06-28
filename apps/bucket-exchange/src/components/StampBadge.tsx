import type { QuestStatus } from '@/types/quest';

interface Props {
  status: QuestStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  recruiting: { label: 'RECRUITING', color: 'border-primary text-primary' },
  closing: { label: 'CLOSING', color: 'border-stamp text-stamp' },
  in_progress: { label: 'IN PROGRESS', color: 'border-ink/50 text-ink/60' },
  completed: { label: 'COMPLETED', color: 'border-ink/30 text-ink/40' },
};

export default function StampBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5 tracking-[0.15em]'
    : 'text-[10px] px-2 py-1 tracking-[0.18em]';

  return (
    <span
      className={`inline-block border-2 font-bold uppercase ${sizeClass} ${config.color} rotate-[-2deg] select-none`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {config.label}
    </span>
  );
}
