import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEFAULT_BUBBLE_SETTINGS } from '../../shared/bubble-settings';
import type { BubblePayload } from '../../shared/ipc';
import { LIMITS, type BubbleMessage } from '../../shared/types';
import { MascotImage } from '../Mascot';
import { MessageBubble } from './MessageBubble';

export function App() {
  const [items, setItems] = useState<BubbleMessage[]>([]);
  const [durationMs, setDurationMs] = useState(5000);
  const [appearance, setAppearance] = useState<BubblePayload['appearance']>(DEFAULT_BUBBLE_SETTINGS);
  const [hover, setHover] = useState(false);
  const [pulse, setPulse] = useState(0);
  const hadItems = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const atTop = appearance.bubblePosition.startsWith('top');

  useEffect(() => {
    const unsubscribe = window.api.onBubble(({ messages, durationMs, appearance }) => {
      setDurationMs(durationMs);
      setAppearance(appearance);
      if (messages.length === 0) return; // 설정 변경만 반영
      setPulse((n) => n + 1);
      setItems((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const next = [...prev, ...messages.filter((m) => !ids.has(m.id))];
        // 최대 개수를 넘으면 가장 오래된 것부터 제거
        return next.slice(-LIMITS.maxBubbles);
      });
    });
    // 구독을 마친 뒤 main에 알려야 첫 메시지를 놓치지 않는다
    window.api.notifyBubbleReady();
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${appearance.bubbleFontSize}px`;
  }, [appearance.bubbleFontSize]);

  // 넘칠 때는 캐릭터 쪽(최신 말풍선)이 보이도록 끝에 붙여 둔다.
  // 사용자가 읽으려고 마우스를 올렸거나 직접 스크롤해서 떨어뜨린 동안은 멈춘다.
  const stickToEnd = useRef(true);
  const hoverRef = useRef(false);
  hoverRef.current = hover;

  const scrollToEnd = useCallback(() => {
    const el = scroller.current;
    if (!el || hoverRef.current || !stickToEnd.current) return;
    el.scrollTop = atTop ? 0 : el.scrollHeight;
  }, [atTop]);

  useLayoutEffect(() => {
    stickToEnd.current = true;
    scrollToEnd();
  }, [items.length, scrollToEnd]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(scrollToEnd);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [scrollToEnd]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const distance = atTop ? el.scrollTop : el.scrollHeight - el.clientHeight - el.scrollTop;
    stickToEnd.current = distance < 8;
  };

  // 모두 사라지면 창을 숨긴다
  useEffect(() => {
    if (items.length > 0) {
      hadItems.current = true;
    } else if (hadItems.current) {
      hadItems.current = false;
      setHover(false);
      window.api.setBubbleHover(false);
      window.api.notifyBubbleEmpty();
    }
  }, [items.length]);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((m) => m.id !== id)), []);

  const open = useCallback(
    (item: BubbleMessage) => {
      window.api.openSpace(item.spaceId);
      remove(item.id);
    },
    [remove],
  );

  const setHovering = (value: boolean) => {
    setHover(value);
    window.api.setBubbleHover(value);
  };

  return (
    <div className={`viewport pos-${appearance.bubblePosition}`}>
      <div
        className="scroller"
        ref={scroller}
        onScroll={onScroll}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          stickToEnd.current = true;
          requestAnimationFrame(scrollToEnd);
        }}
      >
        <ul className="stack">
          {items.map((item) => (
            <MessageBubble
              key={item.id}
              item={item}
              durationMs={durationMs}
              paused={hover}
              onExpire={remove}
              onOpen={open}
            />
          ))}
        </ul>
      </div>
      {items.length > 0 && appearance.mascot !== 'none' && (
        <span className="mascot-wrap">
          <MascotImage
            key={pulse}
            mascot={appearance.mascot}
            customUrl={appearance.customMascotUrl}
            className="mascot"
          />
        </span>
      )}
    </div>
  );
}
