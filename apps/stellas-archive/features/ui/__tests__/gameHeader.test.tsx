import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GameHeader } from "../GameHeader";
import { INTERFACE_TEXT } from "../../game/engine";
import { SupportedLocale } from "../../i18n/i18n";

describe("GameHeader", () => {
  it("displays title and triggers locale toggle", () => {
    const onSetLocale = vi.fn();
    render(
      <GameHeader
        tokenCount={12}
        uiText={INTERFACE_TEXT[SupportedLocale.En]}
        onSetLocale={onSetLocale}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: INTERFACE_TEXT[SupportedLocale.En].pageTitle })).toBeTruthy();
    expect(screen.getByRole("note", { name: INTERFACE_TEXT[SupportedLocale.En].subtitle })).toBeTruthy();
    expect(
      screen.getByRole("status", { name: `${INTERFACE_TEXT[SupportedLocale.En].tokens}: 12` }),
    ).toBeTruthy();

    const toggle = screen.getByRole("button", { name: "Language" });
    fireEvent.click(toggle);
    const koreanOption = screen.getByRole("menuitemradio", { name: "한국어" });
    fireEvent.click(koreanOption);
    expect(onSetLocale).toHaveBeenCalledTimes(1);
    expect(onSetLocale).toHaveBeenCalledWith(SupportedLocale.Ko);
  });
});
