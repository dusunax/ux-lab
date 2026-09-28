import type { OAuth2Client } from 'google-auth-library';

export type ChatMessage = {
  name: string; // spaces/AAAA/messages/BBBB
  createTime: string;
  text?: string;
  fallbackText?: string;
  sender?: {
    name?: string; // users/{id}
    displayName?: string;
    email?: string;
    type?: 'HUMAN' | 'BOT' | 'TYPE_UNSPECIFIED';
  };
  deletionMetadata?: unknown;
};

export type ListMessagesParams = {
  filter?: string;
  orderBy?: 'createTime asc' | 'createTime desc';
  pageSize?: number;
  pageToken?: string;
};

export type ListMessagesResult = { messages: ChatMessage[]; nextPageToken?: string };

export type ListMessages = (spaceId: string, params: ListMessagesParams) => Promise<ListMessagesResult>;

/** API 오류를 poller가 처리하기 쉬운 형태로 분류 */
export type ChatErrorKind = 'auth' | 'forbidden' | 'rateLimit' | 'transient';

export class ChatApiError extends Error {
  constructor(
    readonly kind: ChatErrorKind,
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

export function classifyError(e: unknown): ChatApiError {
  if (e instanceof ChatApiError) return e;
  const err = e as {
    status?: number;
    message?: string;
    response?: { status?: number; data?: { error?: string | { message?: string } } };
  };
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data?.error;
  const message = (typeof data === 'object' ? data?.message : data) ?? err?.message ?? 'unknown error';

  if (data === 'invalid_grant' || /invalid_grant/.test(err?.message ?? '')) {
    return new ChatApiError('auth', status, 'invalid_grant');
  }
  if (status === 401) return new ChatApiError('auth', status, message);
  if (status === 403 || status === 404) return new ChatApiError('forbidden', status, message);
  if (status === 429) return new ChatApiError('rateLimit', status, message);
  return new ChatApiError('transient', status, message); // 5xx, 네트워크 오류, timeout
}

/** Google Chat REST v1 spaces.messages.list */
export function createListMessages(getClient: () => OAuth2Client | null): ListMessages {
  return async (spaceId, params) => {
    const client = getClient();
    if (!client) throw new ChatApiError('auth', undefined, 'not signed in');

    const url = new URL(`https://chat.googleapis.com/v1/${spaceId}/messages`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    try {
      const res = await client.request<{ messages?: ChatMessage[]; nextPageToken?: string }>({
        url: url.toString(),
        timeout: 15_000,
      });
      return { messages: res.data.messages ?? [], nextPageToken: res.data.nextPageToken || undefined };
    } catch (e) {
      throw classifyError(e);
    }
  };
}
