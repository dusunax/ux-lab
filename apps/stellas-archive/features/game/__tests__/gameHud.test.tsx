import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GameHud } from "../GameHud";
import { ACTION_TEXT, getMissionText, initialState, INTERFACE_TEXT, type GameState } from "../engine";
import { SupportedLocale } from "../../i18n/i18n";

const createState = (): GameState => {
  const seed = initialState(SupportedLocale.En);
  return {
    ...seed,
    daily: {
      ...seed.daily,
      missions: [
        { id: "m1", label: "Feed one", requiredAction: "feed", completed: false },
        { id: "m2", label: "Scan once", requiredAction: "scan", completed: false },
      ],
      signal: {
        creatureId: seed.creatures[0]?.id ?? "",
        message: "Need quick action",
        requiredAction: "feed",
        resolved: false,
        rewardClaimed: false,
      },
    },
  };
};

describe("GameHud", () => {
  it("renders mission status and blocks clear action when missions remain", () => {
    const onOpenMissions = vi.fn();
    const onClearCompletedMissions = vi.fn();
    const state = createState();
    const missionText = getMissionText(SupportedLocale.En);

    render(
      <GameHud
        state={state}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        missionText={missionText}
        missionTotal={state.daily.missions.length}
        missionRemaining={2}
        missionProgressPercent={0}
        notice="Observe and respond"
        onOpenMissions={onOpenMissions}
        onClearCompletedMissions={onClearCompletedMissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: INTERFACE_TEXT[SupportedLocale.En].more }));
    expect(onOpenMissions).toHaveBeenCalledTimes(1);

    const clearButton = screen.getByRole("button", { name: INTERFACE_TEXT[SupportedLocale.En].actionRowHint });
    expect(clearButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(clearButton);
    expect(onClearCompletedMissions).not.toHaveBeenCalled();
  });

  it("notifies clear action when all missions are completed", () => {
    const onOpenMissions = vi.fn();
    const onClearCompletedMissions = vi.fn();
    const state = createState();
    const missionText = getMissionText(SupportedLocale.En);

    render(
      <GameHud
        state={{
          ...state,
          daily: {
            ...state.daily,
            missions: [
              { id: "m1", label: "Feed one", requiredAction: "feed", completed: true },
              { id: "m2", label: "Scan once", requiredAction: "scan", completed: true },
            ],
            signal: {
              ...state.daily.signal,
              creatureId: state.daily.signal?.creatureId ?? state.creatures[0]?.id ?? "",
              message: state.daily.signal?.message ?? "Need quick action",
              requiredAction: state.daily.signal?.requiredAction ?? "feed",
              resolved: state.daily.signal?.resolved ?? false,
              rewardClaimed: false,
            },
          },
        }}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        missionText={missionText}
        missionTotal={2}
        missionRemaining={0}
        missionProgressPercent={100}
        notice="Clear ready"
        onOpenMissions={onOpenMissions}
        onClearCompletedMissions={onClearCompletedMissions}
      />,
    );

    const clearButton = screen.getByRole("button", { name: INTERFACE_TEXT[SupportedLocale.En].actionRowHint });
    expect(clearButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(clearButton);
    expect(onClearCompletedMissions).toHaveBeenCalledTimes(1);
  });
});
