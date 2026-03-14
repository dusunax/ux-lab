import type { GameState, InterfaceText, Locale } from "../game/engine";

export type ResearchLogPanelProps = {
  uiText: InterfaceText;
  locale: Locale;
  state: GameState;
  onOpenLog: () => void;
};

export function ResearchLogPanel({ uiText, locale, state, onOpenLog }: ResearchLogPanelProps) {
  const signalText = state.daily.signal?.message ?? uiText.noSignal;
  const signal = state.daily.signal;
  const signalStatus = signal
    ? signal.resolved
      ? signal.rewardClaimed
        ? uiText.signalDone
        : uiText.resolved
      : uiText.needsAction
    : uiText.noSignal;
  const signalBadge = signal
    ? signal.resolved
      ? signal.rewardClaimed
        ? "DONE"
        : "READY"
      : "ALERT"
    : "IDLE";
  const latest = state.archive[0];

  const logHeading = locale === "en" ? "Research Log" : "연구 기록";
  const signalHeading = locale === "en" ? "Signal detected" : "시그널 감지";
  const mutationHeading = locale === "en" ? "Mutation possibility" : "변이 감지";
  const missionHeading = locale === "en" ? "Research status" : "연구 상태";

  const missionText =
    missionHeading +
    `: O:${state.researchData.observation} / M:${state.researchData.mutation} / E:${state.researchData.emotion}`;

  const mutationText = latest
    ? `${latest.name} / ${latest.species} / ${latest.reason}`
    : locale === "en"
      ? "No mutation has been recorded yet."
      : "아직 변이 기록이 없습니다.";

  return (
    <section className="rounded-none border-2 border-[var(--line)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2>{logHeading}</h2>
        <button
          className="border border-[rgba(130,199,255,0.58)] bg-[rgba(11,18,40,0.8)] px-2 py-2 text-[12px] text-[#f2fcff] tracking-[0.3px] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.28)]"
          onClick={onOpenLog}
          type="button"
        >
          {uiText.more}
        </button>
      </div>
      <div className="grid gap-2">
        <article className="p-2 border border-[rgba(130,199,255,0.25)] bg-[rgba(9,16,34,0.54)]">
          <div className="text-[11px] text-[#9fd8ff] mb-1">{signalHeading}</div>
          <output role="status" aria-label={`${signalHeading} ${signalText}`} className="text-[13px] text-[var(--muted)] mb-2 block">
            {signalText}
          </output>
          <div className="flex items-center justify-between border border-[rgba(130,220,255,0.35)] bg-[rgba(8,14,30,0.85)] px-2 py-1 text-[11px] tracking-[0.32px] text-[#95f7de]">
            <output role="status" aria-label={`Signal status ${signalStatus}`}>
              {signalStatus}
            </output>
            <output
              role="status"
              aria-label={
                signalStatus === uiText.noSignal
                  ? "signal-idle"
                  : signalStatus === uiText.resolved
                    ? "signal-ready"
                    : signalStatus === uiText.signalDone
                      ? "signal-done"
                      : "signal-alert"
              }
            >
              {signalBadge}
            </output>
          </div>
        </article>
        <article className="p-2 border border-[rgba(130,199,255,0.25)] bg-[rgba(9,16,34,0.54)]">
          <div className="text-[11px] text-[#9fd8ff] mb-1">{mutationHeading}</div>
          <div className="text-[13px] text-[var(--muted)]">{mutationText}</div>
        </article>
        <article className="p-2 border border-[rgba(130,199,255,0.25)] bg-[rgba(9,16,34,0.54)]">
          <div className="text-[11px] text-[#9fd8ff] mb-1">{missionText}</div>
        </article>
      </div>
    </section>
  );
}
