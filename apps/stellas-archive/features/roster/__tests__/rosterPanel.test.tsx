import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RosterPanel } from "../RosterPanel";
import { INTERFACE_TEXT } from "../../game/engine";

describe("RosterPanel", () => {
  it("shows roster summary and opens roster list", () => {
    const onOpenRoster = vi.fn();
    render(
      <RosterPanel
        total={3}
        speciesCount={2}
        activeName="Moon Glow"
        topSpecies={["Lumina (2)", "Mote (1)"]}
        uiText={INTERFACE_TEXT.en}
        onOpenRoster={onOpenRoster}
      />,
    );

    expect(screen.getByRole("status", { name: `${INTERFACE_TEXT.en.creatures} 3` })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: INTERFACE_TEXT.en.more }));
    expect(onOpenRoster).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: INTERFACE_TEXT.en.select }));
    expect(onOpenRoster).toHaveBeenCalledTimes(2);
  });
});
