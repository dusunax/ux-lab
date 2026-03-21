import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CSSProperties } from "react";

import { ObserverPanel } from "../ObserverPanel";
import { INTERFACE_TEXT } from "../../game/engine";
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
  emotion: "harmonic",
  traits: ["glow", "stable"],
  mutationStage: 0,
  discoveredAt: 1700000000000,
};

describe("ObserverPanel", () => {
  it("shows no target state when creature is absent", () => {
    const onObserverTargetOpen = vi.fn();
    render(
      <ObserverPanel
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        isObserverAutoTarget={true}
        observerCreature={null}
        observerStyle={{}}
        observerYaw={0}
        observerPitch={0}
        isDraggingObserver={false}
        observerShellRef={{ current: null }}
        onObserverTargetOpen={onObserverTargetOpen}
        onPointerDown={() => undefined}
        onPointerMove={() => undefined}
        onPointerUp={() => undefined}
      />,
    );

    expect(screen.getByTestId("observer-no-target-status")).toBeTruthy();
    fireEvent.click(screen.getByTestId("observer-target-button"));
    expect(onObserverTargetOpen).toHaveBeenCalledTimes(1);
  });

  it("shows active observer creature when present and non-auto target", () => {
    render(
      <ObserverPanel
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        isObserverAutoTarget={false}
        observerCreature={creature}
        observerStyle={{ "--lumina-core": "rgb(120, 100, 160)" } as CSSProperties}
        observerYaw={42}
        observerPitch={30}
        isDraggingObserver={false}
        observerShellRef={{ current: null }}
        onObserverTargetOpen={() => undefined}
        onPointerDown={() => undefined}
        onPointerMove={() => undefined}
        onPointerUp={() => undefined}
      />,
    );

    expect(screen.getByTestId("observer-target-status").textContent).toContain("Moon Glow");
    expect(screen.getByTestId("observer-creature-status").textContent).toContain("Moon Glow");
  });
});
