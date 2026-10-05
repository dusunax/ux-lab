interface ImportMetaEnv {
  readonly MAIN_VITE_CORTEX_URL?: string;
  readonly MAIN_VITE_FREE_MODELS?: string;
  readonly MAIN_VITE_FREE_DAILY_BUDGET?: string;
  readonly MAIN_VITE_JEV_DAILY_USD?: string;
  readonly MAIN_VITE_WHISPER_BIN?: string;
  readonly MAIN_VITE_WHISPER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
