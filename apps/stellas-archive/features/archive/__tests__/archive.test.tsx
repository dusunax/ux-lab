import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchivePanel } from "../ArchivePanel";
import { ArchiveModal } from "../ArchiveModal";
import { INTERFACE_TEXT } from "../../game/engine";
import type { ArchiveEntry } from "../../game/engine";

const entry: ArchiveEntry = {
  id: "a1",
  time: "2026-03-01T12:00:00.000Z",
  species: "Mote",
  name: "Moon Glow",
  rgb: { r: 120, g: 150, b: 90 },
  emotion: "calm",
  condition: "70/72/50",
  reason: "Observed color shift",
};

describe("ArchivePanel", () => {
  it("shows empty state when no archive exists", () => {
    const onOpenArchive = vi.fn();
    render(
      <ArchivePanel
        uiText={INTERFACE_TEXT.en}
        archiveCount={0}
        latestArchive={null}
        locale="en"
        onOpenArchive={onOpenArchive}
      />,
    );

    expect(screen.getByRole("status", { name: INTERFACE_TEXT.en.archiveEmpty })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: INTERFACE_TEXT.en.more }));
    expect(onOpenArchive).toHaveBeenCalledTimes(1);
  });

  it("shows latest archive summary", () => {
    render(
      <ArchivePanel
        uiText={INTERFACE_TEXT.en}
        archiveCount={1}
        latestArchive={entry}
        locale="en"
        onOpenArchive={() => undefined}
      />,
    );

    expect(screen.getByRole("status", { name: "Latest archive: Moon Glow" })).toBeTruthy();
  });
});

describe("ArchiveModal", () => {
  it("shows archive list and pagers", () => {
    const onChangeFilter = vi.fn();
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();

    render(
      <ArchiveModal
        uiText={INTERFACE_TEXT.en}
        locale="en"
        archiveSpeciesTabs={[
          { id: "all", label: "All" },
          { id: "Mote", label: "Mote" },
        ]}
        archiveFilter="all"
        filteredArchiveEntries={[entry]}
        archiveSlice={[entry]}
        archiveTotal={1}
        archivePageCount={1}
        safeArchivePage={0}
        onChangeFilter={onChangeFilter}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive filter Mote" }));
    expect(onChangeFilter).toHaveBeenCalledWith("Mote");
    expect(screen.getByRole("status", { name: /Archive count 1 1/ })).toBeTruthy();

    const prevButton = screen.getByRole("button", { name: "Previous archive page" });
    const nextButton = screen.getByRole("button", { name: "Next archive page" });
    expect(prevButton.hasAttribute("disabled")).toBe(true);
    expect(nextButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(prevButton);
    fireEvent.click(nextButton);
    expect(onPrevPage).not.toHaveBeenCalled();
    expect(onNextPage).not.toHaveBeenCalled();
  });
});
