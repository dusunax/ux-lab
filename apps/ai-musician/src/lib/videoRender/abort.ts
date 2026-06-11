export function createAbortError(): Error {
  const error = new Error("영상 생성 요청이 취소되었습니다");
  error.name = "AbortError";
  return error;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw createAbortError();
}
