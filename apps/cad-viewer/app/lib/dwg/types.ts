export type DwgVersionCode =
  | "AC1012"
  | "AC1014"
  | "AC1015"
  | "AC1018"
  | "AC1021"
  | "AC1024"
  | "AC1027"
  | "AC1032"
  | "UNKNOWN";

export type DwgParseReport = {
  signature: string;
  version: DwgVersionCode;
  fileSize: number;
  entityHints: Array<{ type: string; count: number }>;
  textSnippets: string[];
  previewSegments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  warnings: string[];
};
