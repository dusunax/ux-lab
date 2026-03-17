import type { ReactNode } from "react";

type ModalShellProps = {
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
};

export function ModalShell({ title, onClose, closeLabel, children }: ModalShellProps) {
  return (
    <div
      role="presentation"
      aria-label="modal backdrop"
      className="fixed inset-0 z-40 grid place-items-center bg-surface/85 p-[18px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="w-[min(900px,94vw)] max-h-[88vh] rounded-none border-2 border-panelLine bg-panel p-4 grid gap-2.5 text-text overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2>{title}</h2>
          <button
            className="inline-flex h-9 min-h-9 w-fit cursor-pointer items-center justify-center border border-primary/90 bg-[rgba(8,14,32,0.85)] px-2.5 py-2 text-[12px] tracking-[0.2px] text-text transition hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            onClick={onClose}
            type="button"
          >
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
