import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModalShell } from "../ModalShell";

describe("ModalShell", () => {
  it("calls close callback when backdrop is clicked", () => {
    const onClose = vi.fn();

    render(
      <ModalShell title="Test Modal" onClose={onClose} closeLabel="Close">
        <div>modal content</div>
      </ModalShell>,
    );

    const backdrop = screen.getByLabelText("modal backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking modal body", () => {
    const onClose = vi.fn();
    render(
      <ModalShell title="Test Modal" onClose={onClose} closeLabel="Close">
        <button type="button">Action</button>
      </ModalShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
