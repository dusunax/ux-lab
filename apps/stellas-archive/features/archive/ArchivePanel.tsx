import type { ArchiveEntry, InterfaceText } from "../game/engine";
import { formatDateLabel, getEmotionLabel } from "../game/engine";

type ArchivePanelProps = {
  uiText: InterfaceText;
  archiveCount: number;
  latestArchive: ArchiveEntry | null;
  onOpenArchive: () => void;
};

export function ArchivePanel({ uiText, archiveCount, latestArchive, onOpenArchive }: ArchivePanelProps) {
  return (
    <section className="rounded-none border-2 border-primary bg-panel px-4 py-4 shadow-[0_0_30px_rgba(102,240,255,0.15)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2>{uiText.archive}</h2>
        <button
          className="border border-[rgba(130,199,255,0.58)] bg-[rgba(11,18,40,0.8)] px-2 py-2 text-[12px] text-[#f2fcff] tracking-[0.3px] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.28)]"
          onClick={onOpenArchive}
          type="button"
        >
          {uiText.more}
        </button>
      </div>
      <div className="mb-2 grid gap-1.5 p-2.5 border border-[rgba(126,205,255,0.28)] bg-[rgba(8,14,32,0.66)]">
        {latestArchive ? (
          <>
            <output
              role="status"
              aria-label={`Archive entries ${archiveCount}`}
              className="text-[13px] text-muted"
            >
              총 기록: {archiveCount}건
            </output>
            <output
              role="status"
              aria-label={`Latest archive: ${latestArchive.name}`}
              className="text-[13px] text-muted"
            >
              최근 기록: {latestArchive.name} - <strong>{latestArchive.species}</strong>
            </output>
            <div className="text-[13px] text-muted">
              {formatDateLabel(latestArchive.time)} | {latestArchive.reason}
            </div>
            <div className="text-[13px] text-muted">
              RGB {latestArchive.rgb.r}/{latestArchive.rgb.g}/{latestArchive.rgb.b} | {uiText.metaEmotion}:{" "}
              {getEmotionLabel(latestArchive.emotion)}
            </div>
          </>
        ) : (
          <output role="status" aria-label={uiText.archiveEmpty} className="text-[13px] text-muted">
            {uiText.archiveEmpty}
          </output>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] text-[#f6fdff] min-h-10 px-2.5 py-2 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
          onClick={onOpenArchive}
          type="button"
        >
          {uiText.archive}
        </button>
      </div>
    </section>
  );
}
