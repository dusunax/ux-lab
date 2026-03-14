import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MissionsModal } from "../MissionsModal";
import { ACTION_TEXT, INTERFACE_TEXT } from "../../game/engine";
import type { DailyMission } from "../../game/engine";

describe("MissionsModal", () => {
  it("shows empty message when no missions exist", () => {
    render(
      <MissionsModal
        missions={[]}
        uiText={INTERFACE_TEXT.en}
        actionText={ACTION_TEXT.en}
        missionRemaining={0}
        onClearCompletedMissions={() => undefined}
      />,
    );

    expect(screen.getByRole("status", { name: INTERFACE_TEXT.en.missionEmpty })).toBeTruthy();
  });

  it("renders mission rows and action button state", () => {
    const onClearCompletedMissions = vi.fn();
    const missions: DailyMission[] = [
      {
        id: "m1",
        label: "Feed one creature",
        requiredAction: "feed",
        completed: false,
        optional: "Use red food",
      },
      {
        id: "m2",
        label: "Scan once",
        requiredAction: "scan",
        completed: true,
      },
    ];

    render(
      <MissionsModal
        missions={missions}
        uiText={INTERFACE_TEXT.en}
        actionText={ACTION_TEXT.en}
        missionRemaining={1}
        onClearCompletedMissions={onClearCompletedMissions}
      />,
    );

    expect(screen.getByRole("status", { name: "Mission Feed one creature" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Mission optional: Feed one creature Use red food" })).toBeTruthy();
    const clearButton = screen.getByRole("button", { name: INTERFACE_TEXT.en.actionRowHint });
    expect(clearButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(clearButton);
    expect(onClearCompletedMissions).not.toHaveBeenCalled();
  });
});
