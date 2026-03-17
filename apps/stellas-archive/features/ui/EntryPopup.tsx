import { X } from "lucide-react";
import type { Creature, DailyMission, InterfaceText } from "../game/engine";
import { t } from "i18next";

type EntryPopupProps = {
  isOpen: boolean;
  hasUpdate: boolean;
  uiText: InterfaceText;
  tokens: number;
  researchObservation: number;
  researchMutation: number;
  researchEmotion: number;
  streak: number;
  completedMissionsCount: number;
  missionTotal: number;
  signalState: string;
  stellaComment: string;
  statusText: string;
  missionRemaining: number;
  missions: DailyMission[];
  signalResolved: boolean;
  signalRewardClaimed: boolean;
  hasSignal: boolean;
  selectedCreature: Creature | null;
  onClose: () => void;
  onOpenMissions: () => void;
  onClearCompletedMissions: () => void;
  onClaimSignalReward: () => void;
};

export function EntryPopup({
  isOpen,
  hasUpdate,
  uiText,
  tokens,
  researchObservation,
  researchMutation,
  researchEmotion,
  streak,
  completedMissionsCount,
  missionTotal,
  signalState,
  stellaComment,
  statusText,
  missionRemaining,
  missions,
  signalResolved,
  signalRewardClaimed,
  hasSignal,
  selectedCreature,
  onClose,
  onOpenMissions,
  onClearCompletedMissions,
  onClaimSignalReward,
}: EntryPopupProps) {
  if (!isOpen) return null;

  const signalBadge = signalRewardClaimed
      ? t("signalStatusDone")
      : signalState === uiText.resolved
      ? t("signalStatusReady")
      : signalState === uiText.noSignal
        ? t("signalStatusIdle")
        : t("signalStatusUrgent");
  const isSignalRewardDisabled = !hasSignal || !signalResolved || signalRewardClaimed;
  const missionBadge = missionTotal === 0
    ? t("missionStatusIdle")
    : missionRemaining === 0
      ? t("missionStatusDone")
      : t("missionStatusActive");
  const isMissionRewardDisabled = !(missionTotal > 0 && missionRemaining === 0);

  return (
    <aside
      className={`absolute top-[58px] right-2.5 z-10 w-[min(360px,100%)] max-w-[360px] box-border border-2 border-[rgba(125,220,255,0.55)] bg-panel p-3 shadow-[0_0_24px_rgba(112,196,255,0.3)] before:absolute before:right-5 before:top-[-7px] before:h-3 before:w-3 before:border before:border-[rgba(125,220,255,0.55)] before:border-r-0 before:border-b-0 before:bg-panel before:rotate-45 ${
        hasUpdate ? "border-[rgba(255,231,132,0.85)] shadow-[0_0_24px_rgba(255,219,118,0.38)]" : ""
      }`}
      role="dialog"
      aria-label={uiText.active}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <strong className="text-[14px] tracking-[0.3px] text-[#e8fbff]">{uiText.labStatus}</strong>
        <button
          className="grid h-7 min-h-7 w-7 place-items-center border border-[rgba(130,220,255,0.45)] bg-[rgba(9,16,34,0.7)] text-[11px] text-[#def2ff] cursor-pointer"
          onClick={onClose}
          aria-label={uiText.close}
          title={uiText.close}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{uiText.close}</span>
        </button>
      </div>
      {selectedCreature ? (
        <div className="grid gap-1.5">
          <output
            role="status"
            aria-label={`${uiText.tokens}: ${tokens}`}
            className="mb-0 text-[13px] leading-tight text-[#ddf0ff]"
          >
            {uiText.tokens}: {tokens}
          </output>
          <output
            role="status"
            aria-label={`${uiText.research}: ${researchObservation}/${researchMutation}/${researchEmotion}`}
            className="mb-0 break-words text-[13px] leading-tight text-muted"
          >
            {uiText.research}: {researchObservation}/{researchMutation}/{researchEmotion}
          </output>
          <output
            role="status"
            aria-label={`${uiText.streak}: ${streak} ${uiText.days}`}
            className="mb-0 break-words text-[13px] leading-tight text-muted"
          >
            {uiText.streak}: {streak} {uiText.days}
          </output>
          <div className="my-1.5 h-px bg-[rgba(125,220,255,0.22)]" />
          {stellaComment ? (
            <div className="grid gap-0.5">
              <output
                role="status"
                aria-label={uiText.stellaComment}
                className="text-[11px] font-semibold tracking-[0.3px] text-[#9ed6f7]"
              >
                {uiText.stellaComment}
              </output>
              <output
                role="status"
                aria-label={`Stella comment ${stellaComment}`}
                className="text-[12px] leading-tight text-muted"
              >
                {stellaComment}
              </output>
            </div>
          ) : null}
          <div className="my-1.5 h-px bg-[rgba(125,220,255,0.32)]" />
          <div className="mb-0 text-[13px] leading-tight text-[#e8fbff] font-bold">
            {uiText.labStatus}
          </div>
          <div className="mb-2 rounded-none border border-[rgba(130,199,255,0.5)] bg-[rgba(8,14,32,0.72)] p-1.5">
            <div className="mb-1 text-[11px] tracking-[0.35px] text-[#bfe8ff]">{uiText.dailyMissions}</div>
            <output
              role="status"
              aria-label={`${uiText.dailyMissions}: ${uiText.missionCompleted} ${completedMissionsCount}/${missionTotal}`}
              className="mb-1 text-[13px] leading-tight text-muted"
            >
              {uiText.missionCompleted} {completedMissionsCount}/{missionTotal}
            </output>
            <div className="grid max-h-[84px] gap-1 overflow-auto pr-1">
              {missions.length === 0 ? null : (
                missions.map((mission, index) => (
                  <article
                    key={mission.id}
                    role="status"
                    aria-label={`Quest ${index + 1} ${mission.label}`}
                    className="flex items-start justify-between gap-2 rounded-none border border-[rgba(130,220,255,0.35)] break-keep bg-[rgba(8,14,30,0.85)] px-1.5 py-1 text-[12px]"
                  >
                    <div className="flex-1 leading-tight text-[#d6ecff]">
                      <span
                        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                          mission.completed ? "bg-[#95f7de]" : "border border-[#95f7de] bg-[rgba(149,247,222,0.12)]"
                        }`}
                      />
                      <span className={mission.completed ? "line-through text-[#95d7eb]/70" : ""}>{mission.label}</span>
                    </div>
                    <output
                      className="text-[10px] tracking-[0.32px] text-[#95f7de]"
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
            <button
              className="mt-1.5 inline-flex h-8 min-h-8 w-full cursor-pointer items-center justify-center border border-[rgba(130,199,255,0.9)] bg-[rgba(8,14,32,0.85)] px-2 py-2.5 text-[12px] tracking-[0.2px] text-[#eaf6ff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              onClick={onClearCompletedMissions}
              disabled={isMissionRewardDisabled}
              aria-disabled={isMissionRewardDisabled}
              type="button"
            >
              {uiText.actionRowHint}
            </button>
          </div>
          <div className="rounded-none border border-[rgba(130,199,255,0.5)] bg-[rgba(8,14,32,0.72)] p-1.5">
            <div className="mb-1 text-[11px] tracking-[0.35px] text-[#bfe8ff]">{uiText.todaySignal}</div>
            <output
              role="status"
              aria-label={`${uiText.todaySignal} ${signalState}`}
              className="mb-1 text-[13px] leading-tight text-muted"
            >
              {signalState}
            </output>
            <div className="mb-1 flex items-center justify-between border border-[rgba(130,220,255,0.35)] bg-[rgba(8,14,30,0.85)] break-keep px-2 py-1 text-[11px] tracking-[0.32px] text-[#95f7de]">
              <output role="status" aria-label={`Mission status ${statusText}`}>
                {statusText}
              </output>
              <output
                aria-label={
                  signalRewardClaimed
                    ? "signal-done"
                    : signalState === uiText.resolved
                      ? "signal-ready"
                      : signalState === uiText.noSignal
                        ? "signal-idle"
                        : "signal-alert"
                }
              >
                {signalBadge}
              </output>
            </div>
            <button
              className="mt-1.5 inline-flex h-8 min-h-8 w-full cursor-pointer items-center justify-center border border-[rgba(130,199,255,0.9)] bg-[rgba(8,14,32,0.85)] px-2 py-2.5 text-[12px] tracking-[0.2px] text-[#eaf6ff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              onClick={onClaimSignalReward}
              disabled={isSignalRewardDisabled}
              aria-disabled={isSignalRewardDisabled}
              type="button"
            >
              {signalRewardClaimed ? uiText.signalRewardClaimed : uiText.signalRewardHint}
            </button>
          </div>
          <div className="mb-0 flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 min-h-9 cursor-pointer items-center justify-center border border-[rgba(130,199,255,0.9)] bg-[rgba(8,14,32,0.85)] px-2 py-2.5 text-[12px] tracking-[0.2px] text-[#eaf6ff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)]"
              onClick={onOpenMissions}
              type="button"
            >
              {uiText.more}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted break-words">{uiText.noObserverTarget}</div>
      )}
    </aside>
  );
}
