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
      className="fixed inset-0 z-40 grid place-items-center bg-[rgba(3,7,16,0.7)] p-[18px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="w-[min(900px,94vw)] max-h-[88vh] border-2 border-[var(--line)] bg-[rgba(6,12,27,0.94)] shadow-[var(--shadow),0_0_0_1px_rgba(140,227,255,0.22)_inset] grid gap-2.5 p-4 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2>{title}</h2>
          <button
            className="inline-flex h-9 min-h-9 cursor-pointer items-center justify-center border border-[rgba(130,199,255,0.9)] bg-[rgba(8,14,32,0.85)] px-2.5 py-2 text-[12px] tracking-[0.2px] text-[#eaf6ff] leading-tight hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)]"
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
