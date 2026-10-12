import type { OAuth2Client } from 'google-auth-library';

export type GmailHeader = { name: string; value: string };

export type GmailMessage = {
  id: string;
  threadId?: string;
  internalDate: string; // epoch ms string
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
};

export type ListInboxMessagesResult = { messages: GmailMessage[] };
export type ListInboxMessages = (maxResults?: number) => Promise<ListInboxMessagesResult>;

export type GmailErrorKind = 'auth' | 'forbidden' | 'rateLimit' | 'transient';

export class GmailApiError extends Error {
  constructor(
    readonly kind: GmailErrorKind,
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

export function classifyGmailError(e: unknown): GmailApiError {
  if (e instanceof GmailApiError) return e;
  const err = e as {
    status?: number;
    message?: string;
    response?: { status?: number; data?: { error?: string | { message?: string } } };
  };
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data?.error;
  const message = (typeof data === 'object' ? data?.message : data) ?? err?.message ?? 'unknown error';

  if (data === 'invalid_grant' || /invalid_grant/.test(err?.message ?? '')) {
    return new GmailApiError('auth', status, 'invalid_grant');
  }
  if (status === 401) return new GmailApiError('auth', status, message);
  if (status === 403 || status === 404) return new GmailApiError('forbidden', status, message);
  if (status === 429) return new GmailApiError('rateLimit', status, message);
  return new GmailApiError('transient', status, message);
}

/** Gmail API v1: INBOX의 최근 수신 메일 metadata를 조회한다. */
export function createListInboxMessages(getClient: () => OAuth2Client | null): ListInboxMessages {
  return async (maxResults = 10) => {
    const client = getClient();
    if (!client) throw new GmailApiError('auth', undefined, 'not signed in');

    try {
      const list = await client.request<{ messages?: { id: string; threadId?: string }[] }>({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        method: 'GET',
        params: {
          labelIds: 'INBOX',
          maxResults,
        },
        timeout: 15_000,
      });

      const refs = list.data.messages ?? [];
      const messages = await Promise.all(
        refs.map(async (ref) => {
          const res = await client.request<GmailMessage>({
            url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(ref.id)}`,
            method: 'GET',
            params: {
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date'],
            },
            timeout: 15_000,
          });
          return res.data;
        }),
      );
      return { messages };
    } catch (e) {
      throw classifyGmailError(e);
    }
  };
}

export function header(message: GmailMessage, name: string): string {
  const found = message.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return found?.value ?? '';
}
