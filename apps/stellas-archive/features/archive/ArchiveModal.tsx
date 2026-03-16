import type { ArchiveEntry, InterfaceText } from "../game/engine";
import { formatDateLabel, getEmotionLabel } from "../game/engine";

type ArchiveModalProps = {
  uiText: InterfaceText;
  archiveSpeciesTabs: Array<{ id: string; label: string }>;
  archiveFilter: string;
  filteredArchiveEntries: ArchiveEntry[];
  archiveSlice: ArchiveEntry[];
  archiveTotal: number;
  archivePageCount: number;
  safeArchivePage: number;
  onChangeFilter: (filter: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ArchiveModal({
  uiText,
  archiveSpeciesTabs,
  archiveFilter,
  filteredArchiveEntries,
  archiveSlice,
  archiveTotal,
  archivePageCount,
  safeArchivePage,
  onChangeFilter,
  onPrevPage,
  onNextPage,
}: ArchiveModalProps) {
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {archiveSpeciesTabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-none border border-[rgba(130,199,255,0.9)] px-2 py-2 text-[12px] tracking-[0.2px] min-h-[30px] text-[#eaf6ff] bg-[rgba(8,14,30,0.72)] ${
              archiveFilter === tab.id
                ? "bg-[rgba(45,93,170,0.7)] border-[rgba(143,245,255,1)]"
                : "hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)]"
            }`}
            onClick={() => onChangeFilter(tab.id)}
            aria-label={`Archive filter ${tab.label}`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 max-h-[58vh] overflow-auto pr-1">
        {filteredArchiveEntries.length === 0 ? (
          <output role="status" aria-label={uiText.archiveEmpty} className="text-[13px] text-[var(--muted)]">
            {uiText.archiveEmpty}
          </output>
        ) : (
          archiveSlice.map((entry) => (
            <article
              key={entry.id}
              role="status"
              aria-label={`Archive entry ${entry.name} ${entry.species}`}
              className="pb-2 border-b border-[rgba(255,255,255,0.1)] text-[14px] text-[#d5d8f8]"
            >
              <div>
                {entry.name} - <strong>{entry.species}</strong>
              </div>
              <div className="text-[13px] text-[var(--muted)]">
                {formatDateLabel(entry.time)} | {entry.reason} | {uiText.metaEmotion}:{" "}
                {getEmotionLabel(entry.emotion)}
              </div>
              <div className="mt-1 text-[13px] text-[var(--muted)]">
                RGB {entry.rgb.r}/{entry.rgb.g}/{entry.rgb.b} | {uiText.metaState} {entry.condition}
              </div>
            </article>
          ))
        )}
      </div>
      <output role="status" aria-label={`Archive count ${filteredArchiveEntries.length} ${archiveTotal}`} className="mt-2 text-[13px] text-[var(--muted)]">
        {uiText.archive}: {filteredArchiveEntries.length}/{archiveTotal}
      </output>
      <div className="mt-2 flex items-center justify-center gap-2.5">
        <button
          className="min-w-[42px] border border-[rgba(128,209,255,0.45)] bg-[rgba(5,10,22,0.9)] text-[#f6fdff] px-3 py-1.5 hover:border-[#7febbff] hover:shadow-[0_0_12px_rgba(127,232,255,0.3)] disabled:opacity-45"
          aria-label="Previous archive page"
          onClick={onPrevPage}
          disabled={safeArchivePage <= 0}
          type="button"
        >
          ◀
        </button>
        <span className="text-[13px] text-[var(--muted)]">
          {safeArchivePage + 1} / {archivePageCount}
        </span>
        <button
          className="min-w-[42px] border border-[rgba(128,209,255,0.45)] bg-[rgba(5,10,22,0.9)] text-[#f6fdff] px-3 py-1.5 hover:border-[#7febbff] hover:shadow-[0_0_12px_rgba(127,232,255,0.3)] disabled:opacity-45"
          aria-label="Next archive page"
          onClick={onNextPage}
          disabled={safeArchivePage >= archivePageCount - 1}
          type="button"
        >
          ▶
        </button>
      </div>
    </>
  );
}
