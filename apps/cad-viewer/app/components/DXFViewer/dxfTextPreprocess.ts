import DxfParser from "dxf-parser";

/**
 * Clean MTEXT inline format codes, leaving only readable text.
 *
 * Common codes handled:
 *   \A1;   vertical alignment        → removed
 *   \C4;   color index               → removed
 *   \f...;  font name               → removed
 *   \H.7x; text height              → removed
 *   \W1.2; width factor             → removed
 *   \T.5;  tracking                 → removed
 *   \Q15;  oblique angle            → removed
 *   \P     paragraph break          → space
 *   \~     non-breaking space       → space
 *   \U+XXXX Unicode escape          → character
 *   %%C / %%D / %%P  special chars  → Ø / ° / ±
 *   \S a^b;  stacked fraction       → a/b
 *   \O \o  overstrike toggle        → removed
 *   \L \l  underline toggle         → removed
 *   {  }   format group brackets    → removed (content kept)
 */
export function cleanMtext(raw: string): string {
  let t = raw;

  // Unicode escapes  \U+AC00 → 가
  t = t.replace(/\\U\+([0-9A-Fa-f]{4})/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );

  // AutoCAD special-char codes
  t = t.replace(/%%[Cc]/g, "Ø");
  t = t.replace(/%%[Dd]/g, "°");
  t = t.replace(/%%[Pp]/g, "±");
  t = t.replace(/%%[UuOo]/g, ""); // underline/overstrike toggle — no visual in plain text

  // Stacked fractions  \S numerator^denominator;  or  \S numerator/denominator;
  t = t.replace(/\\S([^/^;]+)[/^]([^;]*);/g, "$1/$2");

  // Format codes with arguments  \X...;
  t = t.replace(/\\[ACcFfHhIiLlNnOoPpQqRrSsTtWwXxYyZz][^;\\{}\r\n]*;/g, "");

  // Toggle codes without args  \O  \o  \L  \l  \K  \k
  t = t.replace(/\\[OoLlKkSs]/g, "");

  // Paragraph break  \P  and non-breaking space  \~
  t = t.replace(/\\P/g, " ");
  t = t.replace(/\\~/g, " ");

  // Escaped characters  \\  \{  \}
  t = t.replace(/\\\\/g, "\x00BSLASH\x00");
  t = t.replace(/\\\{/g, "{");
  t = t.replace(/\\\}/g, "}");

  // Remove group brackets (multiple passes handle nesting)
  for (let i = 0; i < 6; i++) {
    const prev = t;
    t = t.replace(/\{([^{}]*)\}/g, "$1");
    if (t === prev) break;
  }

  // Restore escaped backslash
  t = t.replace(/\x00BSLASH\x00/g, "\\");

  // Collapse repeated whitespace
  t = t.replace(/[ \t]{2,}/g, " ").trim();

  return t;
}

/**
 * Scan DXF content line-by-line.
 * For every TEXT / MTEXT / ATTRIB / ATTDEF entity, apply cleanMtext()
 * to group-code 1 and 3 values (the text value fields).
 *
 * Returns the modified DXF string — safe to pass to three-dxf-viewer.
 */
export function preprocessDxfText(content: string): string {
  const lines = content.split(/\r?\n/);
  const out: string[] = [];

  const TEXT_ENTITY_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
  let inTextEntity = false;
  let cleanNextValue = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Group code line (odd-indexed content in DXF pairs)
    // DXF interleaves: line N = group code, line N+1 = value.
    // We track state by watching group-code 0 (entity type marker).

    if (i + 1 < lines.length) {
      const nextRaw = lines[i + 1];
      const nextTrimmed = nextRaw.trim();

      if (trimmed === "0") {
        // Next line names the entity / section
        inTextEntity = TEXT_ENTITY_TYPES.has(nextTrimmed);
        cleanNextValue = false;
        out.push(raw);
        continue;
      }
    }

    if (cleanNextValue) {
      out.push(cleanMtext(raw));
      cleanNextValue = false;
      continue;
    }

    // Group code 1 = primary text value; group code 3 = MTEXT overflow
    if (inTextEntity && (trimmed === "1" || trimmed === "3")) {
      cleanNextValue = true;
    }

    out.push(raw);
  }

  return sanitizeInvalidNumericValues(out.join("\n"));
}

function isNumericGroupCode(code: string): boolean {
  const trimmed = code.trim();
  if (!/^-?\d+$/.test(trimmed)) return false;

  const normalized = Number(trimmed);
  if (!Number.isFinite(normalized)) return false;

  const numericCodes = new Set([
    10, 20, 30,
    11, 21, 31,
    12, 22, 32,
    13, 23, 33,
    14, 24, 34,
    15, 25, 35,
    39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55,
    62, 63, 70, 71, 72, 73, 74, 75,
    140, 141, 142, 143, 144, 145,
    210, 220, 230,
  ]);

  return numericCodes.has(normalized);
}

function isNumericToken(rawValue: string): boolean {
  return /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(rawValue);
}

export function sanitizeInvalidNumericValues(content: string): string {
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length - 1; i += 1) {
    const code = lines[i];
    if (!isNumericGroupCode(code)) continue;

    const rawValue = lines[i + 1]?.trim();
    if (rawValue === undefined) continue;

    if (!isNumericToken(rawValue)) {
      if (/^nan$/i.test(rawValue) || /^[-+]?inf(inity)?$/i.test(rawValue)) {
        lines[i + 1] = "0";
      }
      continue;
    }

    const value = Number(rawValue);
    if (Number.isFinite(value)) continue;

    lines[i + 1] = "0";
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// dxf-parser integration – resolves all INSERT blocks and collects
// every text entity (including those nested inside block definitions).
// Returns a flat array suitable for diagnostic or future custom rendering.
// ---------------------------------------------------------------------------

export interface DxfTextEntity {
  type: "TEXT" | "MTEXT";
  text: string;
  position: { x: number; y: number; z: number };
  height: number;
  rotation: number;
  layer: string;
}

export function extractAllTextEntities(dxfContent: string): DxfTextEntity[] {
  let dxf: ReturnType<DxfParser["parseSync"]>;
  try {
    const parser = new DxfParser();
    dxf = parser.parseSync(dxfContent);
  } catch {
    return [];
  }

  const result: DxfTextEntity[] = [];

  function collectFromList(entities: unknown[]): void {
    for (const raw of entities) {
      const e = raw as Record<string, unknown>;
      if (e.type !== "TEXT" && e.type !== "MTEXT") continue;

      const rawText = (e.text as string | undefined) ?? (e.string as string | undefined) ?? "";
      const cleaned = cleanMtext(rawText);
      if (!cleaned) continue;

      const pos =
        (e.startPoint as { x: number; y: number; z: number } | undefined) ??
        (e.position as { x: number; y: number; z: number } | undefined) ??
        (e.insertionPoint as { x: number; y: number; z: number } | undefined) ??
        { x: 0, y: 0, z: 0 };

      result.push({
        type: e.type as "TEXT" | "MTEXT",
        text: cleaned,
        position: pos,
        height: (e.textHeight as number | undefined) ?? (e.height as number | undefined) ?? 1,
        rotation: (e.rotation as number | undefined) ?? 0,
        layer: (e.layer as string | undefined) ?? "0",
      });
    }
  }

  collectFromList(dxf.entities ?? []);
  for (const block of Object.values(dxf.blocks ?? {})) {
    collectFromList((block as { entities?: unknown[] }).entities ?? []);
  }

  return result;
}
