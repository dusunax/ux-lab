import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActiveCreaturePanel } from "../ActiveCreaturePanel";
import { ACTION_TEXT, INTERFACE_TEXT } from "../../game/engine";
import type { Creature } from "../../game/engine";
import { SupportedLocale } from "../../i18n/i18n";

const creature: Creature = {
  id: "c1",
  speciesId: "species_lumina",
  scientificName: "Luminidae sapiens",
  commonName: "Lumina",
  nickname: "Moon Glow",
  rgb: { r: 120, g: 100, b: 160 },
  state: {
    hunger: 70,
    cleanliness: 72,
    affection: 50,
    energy: 75,
  },
  emotion: "calm",
  traits: ["glow", "stable"],
  mutationStage: 0,
  discoveredAt: 1700000000000,
};

describe("ActiveCreaturePanel", () => {
  it("shows creature-not-found message when there is no target", () => {
    render(
      <ActiveCreaturePanel
        selectedCreature={null}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        token={5}
        performAction={() => undefined}
        onOpenRoster={() => undefined}
        onOpenCreatureDetails={() => undefined}
      />,
    );

    expect(screen.getByRole("status", { name: INTERFACE_TEXT[SupportedLocale.En].creatureNotFound })).toBeTruthy();
  });

  it("dispatches action callbacks with the selected creature", () => {
    const onAction = vi.fn();
    const onOpenRoster = vi.fn();
    const onOpenCreatureDetails = vi.fn();

    render(
      <ActiveCreaturePanel
        selectedCreature={creature}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        token={10}
        performAction={onAction}
        onOpenRoster={onOpenRoster}
        onOpenCreatureDetails={onOpenCreatureDetails}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `${ACTION_TEXT[SupportedLocale.En].feed} (1)` }));
    expect(onAction).toHaveBeenCalledWith("feed", creature);

    fireEvent.click(screen.getByRole("button", { name: `${INTERFACE_TEXT[SupportedLocale.En].select}` }));
    expect(onOpenRoster).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: `${INTERFACE_TEXT[SupportedLocale.En].creatureDetails}` }));
    expect(onOpenCreatureDetails).toHaveBeenCalledTimes(1);
  });
});
