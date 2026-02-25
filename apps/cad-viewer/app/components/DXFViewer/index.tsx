import type { ComponentType } from "react";
import { DXFViewerWithThreeDXFViewer } from "./DXFViewerWithThreeDXFViewer";
import { DXFViewerWithThree } from "./DXFViewerWithThree";
import type { DXFViewerProps } from "./types";

export type { DXFViewerProps };

export type DXFViewerEngine = "three-dxf-viewer" | "three";

const VIEWERS: Record<DXFViewerEngine, ComponentType<DXFViewerProps>> = {
  "three-dxf-viewer": DXFViewerWithThreeDXFViewer,
  three: DXFViewerWithThree,
};

export function createDXFViewer(engine: DXFViewerEngine): ComponentType<DXFViewerProps> {
  return VIEWERS[engine];
}
