import { useState } from 'react';
import {
  DURATIONS,
  FONT_SIZES,
  MASCOTS,
  type BubbleDisplay,
  type BubblePosition,
  type BubbleSettings,
  type Mascot,
} from '../../../shared/bubble-settings';
import type { AppState } from '../../../shared/types';
import { MascotImage, useCustomMascotUrl } from '../../Mascot';

const POSITIONS: { value: BubblePosition; label: string }[] = [
  { value: 'top-left', label: '왼쪽 위' },
  { value: 'top-right', label: '오른쪽 위' },
  { value: 'bottom-left', label: '왼쪽 아래' },
  { value: 'bottom-right', label: '오른쪽 아래' },
];

const DISPLAYS: { value: BubbleDisplay; label: string }[] = [
  { value: 'cursor', label: '마우스가 있는 모니터' },
  { value: 'primary', label: '주 모니터' },
];

const update = (patch: Partial<BubbleSettings>) => void window.api.updateSettings(patch);

/** 알림 설정: 내 메시지 포함 여부, 캐릭터, 표시 시간, 글자 크기, 위치 */
export function AppearanceSettings({ settings }: { settings: AppState['settings'] }) {
  const customUrl = useCustomMascotUrl(settings.customMascotVersion);
  const [imageError, setImageError] = useState<string | null>(null);

  const chooseImage = async () => {
    setImageError(null);
    const res = await window.api.chooseCustomMascot();
    if (!res.ok && res.error) setImageError(res.error);
  };

  const selectMascot = (value: Mascot) => {
    // 사용자 이미지가 아직 없으면 파일 선택부터
    if (value === 'custom' && !customUrl) void chooseImage();
    else update({ mascot: value });
  };

  return (
    <section className="appearance" aria-labelledby="appearance-title">
      <h2 id="appearance-title">알림 설정</h2>

      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.includeOwnMessages}
          onChange={(e) => update({ includeOwnMessages: e.target.checked })}
        />
        <span>내가 보낸 메시지도 알림</span>
      </label>

      <fieldset className="field">
        <legend>캐릭터</legend>
        <div className="choice-row">
          {MASCOTS.map((m) => (
            <label key={m.value} className={`choice ${settings.mascot === m.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mascot"
                value={m.value}
                checked={settings.mascot === m.value}
                onChange={() => selectMascot(m.value)}
                onClick={() => m.value === 'custom' && !customUrl && void chooseImage()}
              />
              {m.value === 'none' ? (
                <span className="mascot-placeholder" aria-hidden>
                  —
                </span>
              ) : m.value === 'custom' && !customUrl ? (
                <span className="mascot-placeholder" aria-hidden>
                  ＋
                </span>
              ) : (
                <MascotImage mascot={m.value} customUrl={customUrl} size={48} />
              )}
              <span className="small">{m.label}</span>
            </label>
          ))}
        </div>
        {customUrl && (
          <button className="btn btn-ghost small align-start" onClick={() => void chooseImage()}>
            내 이미지 바꾸기…
          </button>
        )}
        {imageError && (
          <p className="error small" role="alert">
            {imageError}
          </p>
        )}
      </fieldset>

      <fieldset className="field">
        <legend>표시 시간</legend>
        <div className="segmented" role="radiogroup">
          {DURATIONS.map((d) => (
            <label key={d.value} className={`segment ${settings.bubbleDurationSec === d.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="duration"
                value={d.value}
                checked={settings.bubbleDurationSec === d.value}
                onChange={() => update({ bubbleDurationSec: d.value })}
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>글자 크기</legend>
        <div className="segmented" role="radiogroup">
          {FONT_SIZES.map((f) => (
            <label key={f.value} className={`segment ${settings.bubbleFontSize === f.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="font-size"
                value={f.value}
                checked={settings.bubbleFontSize === f.value}
                onChange={() => update({ bubbleFontSize: f.value })}
              />
              <span style={{ fontSize: f.value }}>{f.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>표시 위치</legend>
        <div className="position-row">
          <div className="position-grid" role="radiogroup" aria-label="화면 모서리">
            {POSITIONS.map((p) => (
              <label
                key={p.value}
                className={`corner corner-${p.value} ${settings.bubblePosition === p.value ? 'selected' : ''}`}
                title={p.label}
              >
                <input
                  type="radio"
                  name="position"
                  value={p.value}
                  checked={settings.bubblePosition === p.value}
                  onChange={() => update({ bubblePosition: p.value })}
                  aria-label={p.label}
                />
                <span className="corner-dot" aria-hidden />
              </label>
            ))}
          </div>
          <select
            value={settings.bubbleDisplay}
            onChange={(e) => update({ bubbleDisplay: e.target.value as BubbleDisplay })}
            aria-label="표시할 모니터"
          >
            {DISPLAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
    </section>
  );
}
