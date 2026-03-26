import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActiveCreaturePanel } from "../ActiveCreaturePanel";
import {
  ACTION_TEXT,
  FEEDS,
  getDefaultFeedInventory,
  INTERFACE_TEXT,
} from "../../game/engine";
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
        feeds={FEEDS}
        feedInventory={getDefaultFeedInventory(FEEDS)}
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
        feeds={FEEDS}
        feedInventory={getDefaultFeedInventory(FEEDS)}
        performAction={onAction}
        onOpenRoster={onOpenRoster}
        onOpenCreatureDetails={onOpenCreatureDetails}
      />,
    );

    expect(screen.getByText((value) => value.includes(creature.commonName))).toBeTruthy();
    expect(screen.getByText((value) => value.includes("Mutation Stage"))).toBeTruthy();
    expect(screen.getByText(creature.nickname)).toBeTruthy();

    fireEvent.click(screen.getByTestId("active-action-feed"));
    fireEvent.click(screen.getByTestId("active-feed-option-feed_red_spore"));
    expect(onAction).toHaveBeenCalledWith("feed", creature, "feed_red_spore");

    fireEvent.click(screen.getByTestId("active-select-button"));
    expect(onOpenRoster).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("active-creature-details-button"));
    expect(onOpenCreatureDetails).toHaveBeenCalledTimes(1);
  });
});
