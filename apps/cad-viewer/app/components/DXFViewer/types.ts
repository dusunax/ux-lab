export type DXFViewerProps = {
  file: File | null;
  onError: (message: string | null) => void;
  onStatus: (status: string) => void;
  onInfo: (value: { ext: string; vertices: number } | null) => void;
  className?: string;
  rotationDeg?: number;
};
