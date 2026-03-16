import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RosterModal } from "../RosterModal";
import { CreatureDetailsModal } from "../CreatureDetailsModal";
import { ACTION_TEXT, INTERFACE_TEXT } from "../../game/engine";
import type { Creature } from "../../game/engine";
import { SupportedLocale } from "../../i18n/i18n";
import { getCatalog } from "../../i18n/i18n";

const lumina: Creature = {
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
  emotion: "harmonic",
  traits: ["glow", "stable"],
  mutationStage: 0,
  discoveredAt: 1700000000000,
};

const glint: Creature = {
  id: "c2",
  speciesId: "species_glint",
  scientificName: "Glintus impulsa",
  commonName: "Glint",
  nickname: "Pulse",
  rgb: { r: 160, g: 90, b: 90 },
  state: {
    hunger: 70,
    cleanliness: 72,
    affection: 50,
    energy: 75,
  },
  emotion: "agitated",
  traits: ["volatile", "pulse"],
  mutationStage: 0,
  discoveredAt: 1700000000000,
};

describe("RosterModal", () => {
  it("renders list and emits selection events", () => {
    const onChangeFilter = vi.fn();
    const onSelectCreature = vi.fn();
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();

    render(
      <RosterModal
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        selectedCreatureId="c1"
        rosterSpeciesTabs={[
          { id: "all", label: "All", count: 2 },
          { id: "species_lumina", label: "Lumina", count: 1 },
          { id: "species_glint", label: "Glint", count: 1 },
        ]}
        rosterFilter="all"
        filteredRoster={[lumina, glint]}
        rosterSlice={[lumina, glint]}
        rosterPageCount={1}
        safeRosterPage={0}
        onChangeFilter={onChangeFilter}
        onSelectCreature={onSelectCreature}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Creature filter Glint" }));
    expect(onChangeFilter).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Select Pulse" }));
    expect(onSelectCreature).toHaveBeenCalledWith("c2");
    expect(onPrevPage).not.toHaveBeenCalled();
    expect(onNextPage).not.toHaveBeenCalled();
  });

  it("renders creature entries with representative color thumbnails", () => {
    const onChangeFilter = vi.fn();
    const onSelectCreature = vi.fn();
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();

    render(
      <RosterModal
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        selectedCreatureId="c1"
        rosterSpeciesTabs={[
          { id: "all", label: "All", count: 2 },
          { id: "species_lumina", label: "Lumina", count: 1 },
          { id: "species_glint", label: "Glint", count: 1 },
        ]}
        rosterFilter="all"
        filteredRoster={[lumina, glint]}
        rosterSlice={[lumina, glint]}
        rosterPageCount={1}
        safeRosterPage={0}
        onChangeFilter={onChangeFilter}
        onSelectCreature={onSelectCreature}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />,
    );

    const luminaSwatch = screen.getByLabelText("Moon Glow Lumina color");
    const glintSwatch = screen.getByLabelText("Pulse Glint color");

    expect((luminaSwatch as HTMLSpanElement).style.getPropertyValue("--mote-color")).toBe("rgb(120, 100, 160)");
    expect((glintSwatch as HTMLSpanElement).style.getPropertyValue("--mote-color")).toBe("rgb(160, 90, 90)");
  });
});

describe("CreatureDetailsModal", () => {
  it("falls back to not found message", () => {
    render(
      <CreatureDetailsModal
        creature={null}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        token={10}
        speciesText={getCatalog(SupportedLocale.En).species}
        onAction={() => undefined}
        onSetObserverTarget={() => undefined}
      />,
    );

    expect(screen.getByRole("status", { name: INTERFACE_TEXT[SupportedLocale.En].creatureNotFound })).toBeTruthy();
  });

  it("triggers mutation and action callbacks", () => {
    const onAction = vi.fn();
    const onSetObserverTarget = vi.fn();
    render(
      <CreatureDetailsModal
        creature={lumina}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        actionText={ACTION_TEXT[SupportedLocale.En]}
        token={10}
        speciesText={getCatalog(SupportedLocale.En).species}
        onAction={onAction}
        onSetObserverTarget={onSetObserverTarget}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`^${ACTION_TEXT[SupportedLocale.En].feed}\\s*\\(\\d+\\)$`) }),
    );
    expect(onAction).toHaveBeenCalledWith("feed", lumina);
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`^${INTERFACE_TEXT[SupportedLocale.En].select}\\s+${lumina.nickname}$`),
      }),
    );
    expect(onSetObserverTarget).toHaveBeenCalledWith(lumina);
  });
});
