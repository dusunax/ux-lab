interface Props {
  label: string;
  isAllergy?: boolean;
  onDelete?: () => void;
  animationDelay?: number;
}

const WARN_ICON = (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 1L8.5 8H0.5L4.5 1Z" /><line x1="4.5" y1="4" x2="4.5" y2="6" />
  </svg>
);

export default function IngredientChip({ label, isAllergy = false, onDelete, animationDelay }: Props) {
  return (
    <span
      className={`flex items-center gap-1 rounded-sm px-2.5 py-1 font-mono text-xs${onDelete ? " tag-animate group" : ""}`}
      style={{
        background: isAllergy ? "var(--danger-light)" : "var(--accent-light)",
        border: `1px solid ${isAllergy ? "var(--danger-mid)" : "color-mix(in srgb, var(--accent-mid) 25%, transparent)"}`,
        color: isAllergy ? "var(--danger)" : "var(--accent)",
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
    >
      {isAllergy && WARN_ICON}
      {label}
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`${label} 삭제`}
          className="opacity-40 transition-opacity hover:opacity-100"
          style={{ color: isAllergy ? "var(--danger)" : "var(--accent)", lineHeight: 1 }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="8" y2="8" /><line x1="8" y1="1" x2="1" y2="8" />
          </svg>
        </button>
      )}
    </span>
  );
}
