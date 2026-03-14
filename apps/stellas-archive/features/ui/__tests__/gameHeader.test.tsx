import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GameHeader } from "../GameHeader";
import { INTERFACE_TEXT } from "../../game/engine";

describe("GameHeader", () => {
  it("displays title and triggers locale toggle", () => {
    const onSetLocale = vi.fn();
    render(
      <GameHeader locale="en" tokenCount={12} uiText={INTERFACE_TEXT.en} onSetLocale={onSetLocale} />,
    );

    expect(screen.getByRole("heading", { level: 1, name: INTERFACE_TEXT.en.pageTitle })).toBeTruthy();
    expect(screen.getByRole("note", { name: INTERFACE_TEXT.en.subtitle })).toBeTruthy();
    expect(
      screen.getByRole("status", { name: `${INTERFACE_TEXT.en.tokens}: 12` }),
    ).toBeTruthy();

    const toggle = screen.getByRole("button", { name: "Language" });
    fireEvent.click(toggle);
    const koreanOption = screen.getByRole("menuitemradio", { name: "한국어" });
    fireEvent.click(koreanOption);
    expect(onSetLocale).toHaveBeenCalledTimes(1);
    expect(onSetLocale).toHaveBeenCalledWith("ko");
  });
});
