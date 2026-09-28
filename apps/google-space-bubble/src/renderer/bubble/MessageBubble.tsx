import { useEffect, useRef, useState } from 'react';
import type { BubbleMessage } from '../../shared/types';

type Props = {
  item: BubbleMessage;
  durationMs: number;
  paused: boolean;
  onExpire: (id: string) => void;
  onOpen: (item: BubbleMessage) => void;
};

const timeFormat = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Chat 서식 일부 정리: *굵게*, <url|라벨> */
function plain(text: string): string {
  return text
    .replace(/<([^|>]+)\|([^>]+)>/g, '$2')
    .replace(/(^|\s)\*(\S(?:[^*\n]*\S)?)\*(?=\s|$)/g, '$1$2');
}

export function MessageBubble({ item, durationMs, paused, onExpire, onOpen }: Props) {
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(durationMs);

  // 표시 시간 타이머 (마우스를 올리면 일시정지, 0이면 직접 닫을 때까지 유지)
  useEffect(() => {
    if (paused || leaving || durationMs <= 0) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, leaving]);

  const time = timeFormat.format(new Date(item.createTime));

  return (
    <li
      className={`bubble ${leaving ? 'leaving' : ''}`}
      onAnimationEnd={(e) => {
        if (leaving && e.animationName === 'bubble-out') onExpire(item.id);
      }}
    >
      <button className="bubble-body" onClick={() => onOpen(item)} title="Google Chat에서 열기">
        <span className="bubble-space">
          <span aria-hidden>💬</span> {item.spaceName}
        </span>
        {item.kind === 'message' ? (
          <>
            <span className="bubble-sender">{item.sender}</span>
            <span className="bubble-text">{plain(item.text)}</span>
          </>
        ) : (
          <span className="bubble-text">새 메시지 {item.count}개</span>
        )}
        <span className="bubble-time">{time}</span>
      </button>
      <button
        className="bubble-close"
        aria-label="닫기"
        title="닫기"
        onClick={(e) => {
          e.stopPropagation();
          setLeaving(true);
        }}
      >
        ✕
      </button>
    </li>
  );
}
