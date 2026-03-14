import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CSSProperties } from "react";

import { ObserverPanel } from "../ObserverPanel";
import { INTERFACE_TEXT } from "../../game/engine";
import type { Creature } from "../../game/engine";

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
        uiText={INTERFACE_TEXT.en}
        isObserverAutoTarget={true}
        observerCreature={null}
        locale="en"
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

    expect(screen.getByRole("status", { name: INTERFACE_TEXT.en.noObserverTarget })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: INTERFACE_TEXT.en.observerTarget }));
    expect(onObserverTargetOpen).toHaveBeenCalledTimes(1);
  });

  it("shows active observer creature when present and non-auto target", () => {
    render(
      <ObserverPanel
        uiText={INTERFACE_TEXT.en}
        isObserverAutoTarget={false}
        observerCreature={creature}
        locale="en"
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

    expect(screen.getByRole("status", { name: "Observer Target: Moon Glow" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Moon Glow Lumina Harmonic" })).toBeTruthy();
  });
});
