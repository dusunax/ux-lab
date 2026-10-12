import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BubbleMessage } from '../../shared/types';
import type { GmailMessage } from './gmail-client';
import { GmailApiError } from './gmail-client';
import { GmailPoller } from './gmail-poller';

const mail = (id: string, internalDate: string, subject = `subject ${id}`): GmailMessage => ({
  id,
  internalDate,
  snippet: `snippet ${id}`,
  payload: {
    headers: [
      { name: 'From', value: 'sender@example.com' },
      { name: 'Subject', value: subject },
    ],
  },
});

function setup({ enabled = true, cursorDate }: { enabled?: boolean; cursorDate?: string } = {}) {
  let gmailEnabled = enabled;
  const cursor: { gmailLastMessageId?: string; gmailLastMessageInternalDate?: string } = cursorDate
    ? { gmailLastMessageId: 'old', gmailLastMessageInternalDate: cursorDate }
    : {};
  const list = vi.fn<(maxResults?: number) => Promise<{ messages: GmailMessage[] }>>();
  const poller = new GmailPoller({
    listInboxMessages: list,
    isEnabled: () => gmailEnabled,
    getCursor: () => cursor,
    saveCursor: (next) => Object.assign(cursor, next),
    pollIntervalMs: () => 5000,
    now: () => 1_000_000,
    random: () => 0,
  });
  const bubbles: BubbleMessage[][] = [];
  poller.on('messages', (m) => bubbles.push(m));
  return { list, poller, bubbles, cursor, setEnabled: (value: boolean) => (gmailEnabled = value) };
}

describe('GmailPoller', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('최초 동기화는 최신 메일을 기준점으로 저장하고 알림하지 않는다', async () => {
    const { list, poller, bubbles, cursor } = setup();
    list.mockResolvedValueOnce({ messages: [mail('m1', '1000')] });

    await poller.pollInbox();

    expect(list).toHaveBeenCalledWith(1);
    expect(cursor.gmailLastMessageId).toBe('m1');
    expect(cursor.gmailLastMessageInternalDate).toBe('1000');
    expect(bubbles).toEqual([]);
    expect(poller.status.status).toBe('ok');
  });

  it('기준점 이후 수신 메일을 오래된 순서대로 알림하고 cursor를 갱신한다', async () => {
    const { list, poller, bubbles, cursor } = setup({ cursorDate: '1000' });
    list.mockResolvedValueOnce({ messages: [mail('m3', '3000'), mail('m2', '2000'), mail('old', '1000')] });

    await poller.pollInbox();

    expect(bubbles).toHaveLength(1);
    expect(bubbles[0].map((b) => b.id)).toEqual(['gmail/m2', 'gmail/m3']);
    expect(bubbles[0][0]).toMatchObject({ source: 'gmail', spaceName: 'Gmail', sender: 'sender@example.com' });
    expect(cursor.gmailLastMessageId).toBe('m3');
    expect(cursor.gmailLastMessageInternalDate).toBe('3000');
  });

  it('403이면 Gmail 권한 오류 상태가 된다', async () => {
    const { list, poller } = setup({ cursorDate: '1000' });
    list.mockRejectedValueOnce(new GmailApiError('forbidden', 403, 'insufficient permissions'));

    await poller.pollInbox();

    expect(poller.status).toMatchObject({ status: 'error', error: 'Gmail 읽기 권한이 없습니다. 로그아웃 후 다시 로그인해 주세요.' });
  });
});
