const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 사용자가 입력한 Space ID 또는 Chat URL을 "spaces/XXXX" 형태로 정규화한다.
 * 형식을 인식할 수 없으면 null.
 *
 * 허용: spaces/AAAA, AAAA,
 *       https://chat.google.com/room/AAAA,
 *       https://mail.google.com/chat/u/0/#chat/space/AAAA
 */
export function normalizeSpaceId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  const m = s.match(/(?:^|\/|#chat\/)(?:spaces|room|space)\/([A-Za-z0-9_-]+)/);
  if (m) return `spaces/${m[1]}`;

  return ID_PATTERN.test(s) ? `spaces/${s}` : null;
}

/** Bubble 클릭 시 여는 Google Chat URL */
export function spaceUrl(spaceId: string): string {
  const id = spaceId.replace(/^spaces\//, '');
  if (!ID_PATTERN.test(id)) throw new Error(`invalid space id: ${spaceId}`);
  return `https://chat.google.com/room/${id}`;
}
