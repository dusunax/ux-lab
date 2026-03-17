import type { ActionText, DailyMission, InterfaceText } from "../game/engine";
import { t } from "i18next";

type MissionsModalProps = {
  missions: DailyMission[];
  uiText: InterfaceText;
  actionText: ActionText;
  missionRemaining: number;
  onClearCompletedMissions: () => void;
};

export function MissionsModal({
  missions,
  uiText,
  actionText,
  missionRemaining,
  onClearCompletedMissions,
}: MissionsModalProps) {
  const canClearMissions = missions.length > 0 && missionRemaining === 0;

  return (
    <div className="grid gap-2 max-h-[58vh] overflow-auto pr-1">
      {missions.length === 0 ? (
        <output role="status" aria-label={uiText.missionEmpty} className="text-[13px] text-muted">
          {uiText.missionEmpty}
        </output>
      ) : null}
      <div className="sticky top-0 z-0 border-b border-[rgba(130,210,255,0.45)] pb-2">
        <div className="mb-0.5 text-[12px] tracking-[0.4px] text-[#bfe8ff]">
          {uiText.dailyMissions}
        </div>
      </div>
      {missions.map((mission) => (
        <article
          key={mission.id}
          role="status"
          aria-label={`Mission ${mission.label}`}
          className="grid gap-1 rounded-none border border-[rgba(130,210,255,0.35)] bg-[rgba(8,14,32,0.88)] px-2 py-1.5"
        >
          <div className="flex items-start gap-2 text-[13px] text-[#d5d8f8]">
            <span
              className={`mt-[1px] inline-block h-2.5 w-2.5 rounded-full ${
                mission.completed ? "bg-[#95f7de]" : "border border-[#95f7de] bg-[rgba(149,247,222,0.12)]"
              }`}
            />
            <div className="flex-1">
              {mission.label}
            </div>
            <output
              className="text-[11px] tracking-[0.32px] text-[#95f7de]"
              aria-label={
                mission.completed
                  ? `${mission.label} ${t("missionStatusCompleted")}`
                  : `${mission.label} ${t("missionStatusActive")}`
              }
            >
              {mission.completed ? t("missionStatusCompleted") : t("missionStatusActive")}
            </output>
          </div>
          {mission.optional ? (
            <output
              role="status"
              aria-label={`Mission optional: ${mission.label} ${mission.optional}`}
              className="ml-4 border-l-2 border-[rgba(149,247,222,0.45)] px-2 text-[12px] text-muted"
            >
              {mission.optional}
            </output>
          ) : null}
          <div className="border-t border-[rgba(255,255,255,0.08)] pt-1 text-[11px] text-[#95f7de] tracking-[0.3px]">
            {uiText.requiredAction}:{" "}
            {mission.requiredAction === "feed"
              ? actionText.feed
              : mission.requiredAction === "clean"
                ? actionText.clean
                : mission.requiredAction === "scan"
                  ? actionText.scan
                  : mission.requiredAction === "decorate"
                    ? actionText.decorate
                    : actionText.play}
          </div>
        </article>
      ))}
      <button
        className="inline-flex w-full items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] text-[#f6fdff] min-h-10 px-2.5 py-2 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
        aria-label={uiText.actionRowHint}
        onClick={onClearCompletedMissions}
        disabled={!canClearMissions}
        aria-disabled={!canClearMissions}
        type="button"
      >
        {uiText.actionRowHint}
      </button>
    </div>
  );
}
