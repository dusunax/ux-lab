import { useEffect, useState } from 'react';
import type { Mascot } from '../shared/bubble-settings';
import phone from './assets/mascot-phone.png';
import wave from './assets/mascot-wave.png';

export const MASCOT_SRC: Record<'wave' | 'phone', string> = { wave, phone };

type Props = {
  mascot: Mascot;
  /** mascot === 'custom'일 때 사용할 이미지 URL */
  customUrl?: string | null;
  className?: string;
  size?: number;
};

/** 선택한 캐릭터 이미지. 'none'이거나 사용자 이미지가 없으면 아무것도 그리지 않는다. */
export function MascotImage({ mascot, customUrl, className, size }: Props) {
  const src = mascot === 'custom' ? customUrl : mascot === 'none' ? null : MASCOT_SRC[mascot];
  if (!src) return null;
  return <img className={className} src={src} alt="" width={size} height={size} draggable={false} />;
}

/** 설정 창용: 사용자 이미지 data URL을 가져온다. version이 바뀌면 다시 가져온다. */
export function useCustomMascotUrl(version: number | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void window.api.getCustomMascot().then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [version]);
  return url;
}
