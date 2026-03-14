import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ObserverTargetModal } from "../ObserverTargetModal";
import { INTERFACE_TEXT } from "../../game/engine";
import type { Creature } from "../../game/engine";

const mote: Creature = {
  id: "c1",
  speciesId: "species_mote",
  scientificName: "Motenia driftra",
  commonName: "Mote",
  nickname: "Moon",
  rgb: { r: 80, g: 150, b: 90 },
  state: {
    hunger: 70,
    cleanliness: 72,
    affection: 50,
    energy: 75,
  },
  emotion: "curious",
  traits: ["adaptive", "scatter"],
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

describe("ObserverTargetModal", () => {
  it("shows auto option and creature choices", () => {
    const onAuto = vi.fn();
    const onSelect = vi.fn();

    render(
      <ObserverTargetModal
        uiText={INTERFACE_TEXT.en}
        creatures={[mote, glint]}
        isObserverAutoTarget={true}
        observerTargetId={null}
        onAuto={onAuto}
        onSelect={onSelect}
      />,
    );

    const autoButton = screen.getByRole("button", { name: INTERFACE_TEXT.en.observerAuto });
    expect(autoButton.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(autoButton);
    expect(onAuto).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Pulse Glint" }));
    expect(onSelect).toHaveBeenCalledWith("c2");
  });

  it("renders color thumbnails for each creature option", () => {
    const onAuto = vi.fn();
    const onSelect = vi.fn();

    render(
      <ObserverTargetModal
        uiText={INTERFACE_TEXT.en}
        creatures={[mote, glint]}
        isObserverAutoTarget={false}
        observerTargetId="c1"
        onAuto={onAuto}
        onSelect={onSelect}
      />,
    );

    const moteSwatch = screen.getByLabelText("Moon Mote color");
    const glintSwatch = screen.getByLabelText("Pulse Glint color");

    expect(moteSwatch).toBeTruthy();
    expect(glintSwatch).toBeTruthy();
    expect((moteSwatch as HTMLSpanElement).style.getPropertyValue("--mote-color")).toBe("rgb(80, 150, 90)");
    expect((glintSwatch as HTMLSpanElement).style.getPropertyValue("--mote-color")).toBe("rgb(160, 90, 90)");
  });
});
