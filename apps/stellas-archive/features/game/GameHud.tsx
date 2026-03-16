import type { CSSProperties } from "react";
import { t } from "i18next";
import type {
  GameState,
  InterfaceText,
  MissionText,
} from "../game/engine";
import type { ActionText } from "../game/engine";

type GameHudProps = {
  state: GameState;
  uiText: InterfaceText;
  actionText: ActionText;
  missionText: MissionText;
  missionTotal: number;
  missionRemaining: number;
  missionProgressPercent: number;
  notice: string;
  onOpenMissions: () => void;
  onClearCompletedMissions: () => void;
};

export function GameHud({
  state,
  uiText,
  missionText,
  notice,
  missionTotal,
  missionRemaining,
  missionProgressPercent,
  onOpenMissions,
  onClearCompletedMissions,
}: GameHudProps) {
  const missionCompleted = missionTotal - missionRemaining;
  const missionBadge = missionTotal === 0
    ? t("missionStatusIdle")
    : missionRemaining === 0
      ? t("missionStatusDone")
      : t("missionStatusActive");
  const missionStatusTone =
    missionTotal === 0 ? "mission-idle" : missionRemaining === 0 ? "mission-done" : "mission-active";
  const firstMission = state.daily.missions[0];
  const stellaComment = firstMission
    ? firstMission.requiredAction === "feed"
      ? missionText.feedLabel
      : firstMission.requiredAction === "scan"
        ? missionText.scanLabel
        : missionText.playLabel
    : "";
  const signalText = state.daily.signal?.message ?? uiText.noSignal;
  const signal = state.daily.signal;
  const statusText = signal
      ? signal.resolved
        ? signal.rewardClaimed
        ? t("signalStatusDone")
        : t("signalStatusReady")
      : t("signalStatusUrgent")
    : t("signalStatusIdle");
  const statusTone = signal
    ? signal.resolved
      ? signal.rewardClaimed
        ? "signal-done"
        : "signal-ready"
      : "signal-alert"
    : "signal-idle";
  const canClearMissions = missionTotal > 0 && missionRemaining === 0;
  const signalBadge = signal
      ? signal.resolved
      ? signal.rewardClaimed
      ? t("signalStatusDone")
      : t("signalStatusReady")
      : t("signalStatusUrgent")
    : t("signalStatusIdle");
  const signalHint = state.daily.signal?.message ?? "";

  return (
    <section className="w-full">
      <section className="rounded-none border-2 border-[var(--line)] bg-[var(--card)] px-4 py-3.5 shadow-[var(--shadow)] relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2>{uiText.labStatus}</h2>
          <span className="text-[var(--accent)] text-sm">{state.tokens}T</span>
        </div>

        <div className="mt-0.5 mb-2.5">
          <div className="flex flex-wrap gap-3 text-[15px] text-[#d6ecff]">
            <span>
              {uiText.tokens}: {state.tokens}
            </span>
            <span>
              {uiText.streak}: {state.daily.streak}
            </span>
            <span>
              {uiText.research}: {state.researchData.observation}/{state.researchData.mutation}/{state.researchData.emotion}
            </span>
          </div>
        </div>

        <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="text-[13px] text-[var(--muted)]">{uiText.todaySignal}: </span>
          <span className="text-[13px] text-[var(--muted)]">{state.daily.lastVisitDate}</span>
        </div>

        <article className="rounded-none border-2 border-[rgba(125,210,255,0.55)] bg-[rgba(9,15,30,0.55)] px-2.5 py-2">
          <div className="mb-1 text-[11px] tracking-[0.35px] text-[#bfe8ff]">{uiText.todaySignal}</div>
          <output
            role="status"
            aria-label={`${uiText.todaySignal} ${signalText}`}
            className="mb-1 text-[13px] leading-tight text-[var(--muted)]"
          >
            {signalText}
          </output>
          {signalHint ? (
            <output
              role="status"
              aria-label={t("signalDetailPrefix", { detail: signalHint })}
              className="mb-2 block text-[12px] leading-tight text-[var(--muted)]"
            >
              {signalHint}
            </output>
          ) : null}
          <div
            className="mt-1 inline-flex items-center justify-between border border-[rgba(130,220,255,0.35)] bg-[rgba(8,14,30,0.85)] px-2 py-1 text-[11px] tracking-[0.32px] text-[#95f7de] w-full"
          >
            <span>{statusText}</span>
            <output
              role="status"
              aria-label={statusTone}
            >
              {signalBadge}
            </output>
          </div>
        </article>

        <div className="mt-2 mb-3 rounded-none border-2 border-[rgba(130,210,255,0.45)] bg-[rgba(9,16,32,0.55)] px-2 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[12px] tracking-[0.4px] text-[#c9ecff]">{uiText.dailyMissions}</h2>
            <output
              role="status"
              aria-label={`${uiText.missionCompleted} ${missionCompleted} ${missionTotal}`}
              className="text-[11px] text-[#95f7de]"
            >
              {uiText.missionCompleted} {missionCompleted}/{missionTotal}
            </output>
          </div>
          <div className="grid max-h-[126px] gap-1.5 overflow-auto pr-1">
            {state.daily.missions.length === 0 ? (
              <output role="status" aria-label={notice} className="text-[13px] text-[var(--muted)]">
                {notice}
              </output>
            ) : (
              state.daily.missions.map((mission, index) => (
                <article
                  key={mission.id}
                  role="status"
                  aria-label={`Quest ${index + 1} ${mission.label}`}
                  className="flex items-start justify-between gap-2 rounded-none border border-[rgba(130,220,255,0.35)] bg-[rgba(8,14,30,0.85)] px-2 py-1.5 text-[13px]"
                >
                  <div className="flex-1 leading-snug text-[#d6ecff]">
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${mission.completed ? "bg-[#95f7de]" : "border border-[#95f7de] bg-[rgba(149,247,222,0.08)]"}`} />
                    <span className={mission.completed ? "line-through text-[#95d7eb]/70" : ""}>{mission.label}</span>
                  </div>
                  <output
                    className="text-[11px] tracking-[0.35px] text-[#95f7de]"
                    aria-label={
                        mission.completed
                        ? `${mission.label} ${t("missionStatusCompleted")}`
                        : `${mission.label} ${t("missionStatusActive")}`
                    }
                  >
                    {mission.completed ? t("missionStatusCompleted") : t("missionStatusActive")}
                  </output>
                </article>
                ))
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between border border-[rgba(130,220,255,0.35)] bg-[rgba(8,14,30,0.85)] px-2 py-1 text-[11px] tracking-[0.32px] text-[#95f7de]">
            <output role="status" aria-label={`Mission status ${uiText.missionCompleted} ${missionCompleted}/${missionTotal}`}>
              {uiText.missionCompleted} {missionCompleted}/{missionTotal}
            </output>
            <output
              role="status"
              aria-label={missionRemaining === 0 ? "mission-done" : missionTotal === 0 ? "mission-idle" : "mission-active"}
            >
              {missionBadge}
            </output>
          </div>
          <div className="mt-2 h-[8px] border border-[rgba(126,232,255,0.6)] bg-[rgba(120,188,255,0.16)] overflow-hidden">
            <div
              className="h-full border-r-[2px] border-[rgba(255,255,255,0.4)] bg-[linear-gradient(90deg,#95f7de,#7de7ff)] shadow-[inset_0_0_4px_rgba(255,255,255,0.5)] w-[var(--mission-progress)]"
              style={{ ["--mission-progress" as keyof CSSProperties]: `${missionProgressPercent}%` } as CSSProperties}
            />
          </div>
          <p className="mt-1.5 text-[13px] text-[var(--muted)]">{firstMission ? stellaComment : notice}</p>
        </div>

        <button
          className="mb-2 w-full min-h-[30px] border border-[rgba(130,199,255,0.58)] bg-[rgba(11,18,40,0.8)] px-2 py-2 text-[12px] tracking-[0.3px] text-[#f2fcff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.28)] transition-all"
          onClick={onOpenMissions}
          type="button"
          aria-label={uiText.more}
        >
          {uiText.more}
        </button>

        <button
          className="flex w-full items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] text-[#f6fdff] min-h-[40px] px-2.5 py-2 font-normal tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed text-[15px]"
          onClick={onClearCompletedMissions}
          disabled={!canClearMissions}
          type="button"
          aria-disabled={!canClearMissions}
        >
          {uiText.actionRowHint}
        </button>
      </section>
    </section>
  );
}
