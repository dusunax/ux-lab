export const ASSET_PATHS = {
  imgs: {
    logo: "/assets/imgs/260315-1340.png",
    observerChamber: "/assets/imgs/260314-2011.png",
  },
  icons: {
    favicon16: "/assets/icons/favicon-16x16.png",
    favicon32: "/assets/icons/favicon-32x32.png",
    favicon192: "/assets/icons/favicon.png",
    faviconIco: "/assets/icons/favicon.ico",
    appleTouch: "/assets/icons/apple-touch-icon.png",
  },
} as const;

export const OBSERVER_CHAMBER_BG_IMAGES = {
  base: "linear-gradient(145deg,rgba(5,10,24,0.82),rgba(7,16,34,0.88))",
  cornerGlow:
    "radial-gradient(circle at 22% 16%,rgba(132,196,255,0.12),transparent 43%)",
  cornerPulse:
    "radial-gradient(circle at 82% 82%,rgba(205,153,255,0.1),transparent 44%)",
} as const;

