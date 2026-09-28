import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BubbleMessage, MonitoredSpace } from '../../shared/types';
import { backoffMs } from './backoff';
import { ChatApiError, classifyError, type ChatMessage, type ListMessagesParams } from './chat-client';
import { MessagePoller } from './message-poller';

const SELF = { userName: 'users/111', email: 'me@example.com' };

const msg = (id: string, time: string, sender: Partial<NonNullable<ChatMessage['sender']>> = {}): ChatMessage => ({
  name: `spaces/A/messages/${id}`,
  createTime: time,
  text: `text ${id}`,
  sender: { name: 'users/222', displayName: '동료', type: 'HUMAN', ...sender },
});

function setup(spaces: MonitoredSpace[], { includeOwn = true } = {}) {
  const list = vi.fn<(spaceId: string, p: ListMessagesParams) => Promise<{ messages: ChatMessage[]; nextPageToken?: string }>>();
  const poller = new MessagePoller({
    listMessages: list,
    getSpaces: () => spaces,
    saveCursor: (id, c) => Object.assign(spaces.find((s) => s.spaceId === id)!, c),
    excludeSelf: () => (includeOwn ? undefined : SELF),
    pollIntervalMs: () => 5000,
    now: () => 1_000_000,
    random: () => 0,
  });
  const bubbles: BubbleMessage[][] = [];
  poller.on('messages', (m) => bubbles.push(m));
  return { list, poller, bubbles, spaces };
}

describe('MessagePoller', () => {
  let space: MonitoredSpace;
  beforeEach(() => {
    space = { spaceId: 'spaces/A', spaceName: 'Space A', enabled: true };
  });

  it('최초 동기화는 기준점만 저장하고 알림하지 않는다', async () => {
    const { list, poller, bubbles } = setup([space]);
    list.mockResolvedValueOnce({ messages: [msg('m1', '2026-09-28T01:00:00Z')] });

    await poller.pollSpace('spaces/A');

    expect(list).toHaveBeenCalledWith('spaces/A', { orderBy: 'createTime desc', pageSize: 1 });
    expect(space.lastMessageTime).toBe('2026-09-28T01:00:00Z');
    expect(bubbles).toEqual([]);
    expect(poller.statusOf('spaces/A').status).toBe('ok');
  });

  it('기준점 이후 새 메시지를 알림하고 cursor를 갱신한다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller, bubbles } = setup([space]);
    list.mockResolvedValueOnce({ messages: [msg('m2', '2026-09-28T01:01:00Z'), msg('m3', '2026-09-28T01:02:00Z')] });

    await poller.pollSpace('spaces/A');

    expect(list.mock.calls[0][1]).toMatchObject({ filter: 'createTime > "2026-09-28T01:00:00Z"', orderBy: 'createTime asc' });
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0].map((b) => b.id)).toEqual(['spaces/A/messages/m2', 'spaces/A/messages/m3']);
    expect(bubbles[0][0]).toMatchObject({ kind: 'message', spaceName: 'Space A', sender: '동료', text: 'text m2' });
    expect(space.lastMessageName).toBe('spaces/A/messages/m3');
    expect(space.lastMessageTime).toBe('2026-09-28T01:02:00Z');
  });

  it('같은 메시지는 중복 알림하지 않는다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller, bubbles } = setup([space]);
    const m2 = msg('m2', '2026-09-28T01:01:00Z');
    list.mockResolvedValueOnce({ messages: [m2] });
    await poller.pollSpace('spaces/A');
    // 서버가 같은 메시지를 다시 돌려주는 경우
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    list.mockResolvedValueOnce({ messages: [m2] });
    await poller.pollSpace('spaces/A');

    expect(bubbles.flat()).toHaveLength(1);
  });

  it('삭제된 메시지는 제외하고, 본인·봇 메시지는 알림한다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller, bubbles } = setup([space]);
    list.mockResolvedValueOnce({
      messages: [
        msg('mine', '2026-09-28T01:01:00Z', { name: SELF.userName }),
        msg('mine-email', '2026-09-28T01:01:30Z', { name: 'users/999', email: SELF.email }),
        { ...msg('deleted', '2026-09-28T01:02:00Z'), deletionMetadata: {} },
        msg('bot', '2026-09-28T01:03:00Z', { name: 'users/bot', displayName: 'gitlab', type: 'BOT' }),
      ],
    });

    await poller.pollSpace('spaces/A');

    expect(bubbles.flat().map((b) => b.id)).toEqual([
      'spaces/A/messages/mine',
      'spaces/A/messages/mine-email',
      'spaces/A/messages/bot',
    ]);
    // 삭제된 메시지도 cursor는 전진한다
    expect(space.lastMessageTime).toBe('2026-09-28T01:03:00Z');
  });

  it('본인 메시지 제외 설정이면 sender.name 또는 email이 같은 메시지를 알림하지 않는다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller, bubbles } = setup([space], { includeOwn: false });
    list.mockResolvedValueOnce({
      messages: [
        msg('mine', '2026-09-28T01:01:00Z', { name: SELF.userName }),
        msg('mine-email', '2026-09-28T01:01:30Z', { name: 'users/999', email: SELF.email }),
        msg('other', '2026-09-28T01:02:00Z'),
      ],
    });

    await poller.pollSpace('spaces/A');

    expect(bubbles.flat().map((b) => b.id)).toEqual(['spaces/A/messages/other']);
    expect(space.lastMessageTime).toBe('2026-09-28T01:02:00Z');
  });

  it('새 메시지가 5개를 넘으면 요약 Bubble 1개로 알린다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller, bubbles } = setup([space]);
    list.mockResolvedValueOnce({
      messages: Array.from({ length: 7 }, (_, i) => msg(`m${i}`, `2026-09-28T01:0${i}:30Z`)),
    });

    await poller.pollSpace('spaces/A');

    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toEqual([expect.objectContaining({ kind: 'summary', count: 7, spaceName: 'Space A' })]);
  });

  it('nextPageToken을 따라 최대 3페이지까지 조회한다', async () => {
    space.lastMessageTime = '2026-09-28T01:00:00Z';
    const { list, poller } = setup([space]);
    list.mockResolvedValue({ messages: [], nextPageToken: 'next' });

    await poller.pollSpace('spaces/A');

    expect(list).toHaveBeenCalledTimes(3);
    expect(list.mock.calls[1][1].pageToken).toBe('next');
  });

  it('403이면 해당 Space만 오류 상태가 되고 다른 Space는 계속 조회된다', async () => {
    const b: MonitoredSpace = { spaceId: 'spaces/B', spaceName: 'Space B', enabled: true };
    const { list, poller } = setup([space, b]);
    list.mockImplementation(async (id) => {
      if (id === 'spaces/A') throw new ChatApiError('forbidden', 403, 'denied');
      return { messages: [] };
    });

    await poller.pollSpace('spaces/A');
    await poller.pollSpace('spaces/B');

    expect(poller.statusOf('spaces/A')).toMatchObject({ status: 'error', error: '이 Space에 접근할 수 없습니다.' });
    expect(poller.statusOf('spaces/B').status).toBe('ok');
  });

  it('네트워크 오류가 3회 연속되면 waiting 상태가 되고 성공하면 복구된다', async () => {
    const { list, poller } = setup([space]);
    list.mockRejectedValue(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }));

    for (let i = 0; i < 3; i++) await poller.pollSpace('spaces/A');
    expect(poller.statusOf('spaces/A').status).toBe('waiting');
    expect(poller.waiting).toBe(true);

    list.mockResolvedValue({ messages: [] });
    await poller.pollSpace('spaces/A');
    expect(poller.statusOf('spaces/A').status).toBe('ok');
    expect(poller.waiting).toBe(false);
  });

  it('429면 전체 polling을 멈추고 waiting으로 표시한다', async () => {
    const { list, poller } = setup([space]);
    list.mockRejectedValue(new ChatApiError('rateLimit', 429, 'quota'));

    await poller.pollSpace('spaces/A');

    expect(poller.waiting).toBe(true);
  });

  it('인증 오류는 authError 이벤트를 발생시킨다', async () => {
    const { list, poller } = setup([space]);
    list.mockRejectedValue(new ChatApiError('auth', 401, 'unauthenticated'));
    const onAuth = vi.fn();
    poller.on('authError', onAuth);

    await poller.pollSpace('spaces/A');

    expect(onAuth).toHaveBeenCalledOnce();
  });
});

describe('classifyError', () => {
  it.each([
    [{ response: { status: 401 } }, 'auth'],
    [{ response: { status: 400, data: { error: 'invalid_grant' } } }, 'auth'],
    [{ response: { status: 403 } }, 'forbidden'],
    [{ response: { status: 404 } }, 'forbidden'],
    [{ response: { status: 429 } }, 'rateLimit'],
    [{ response: { status: 503 } }, 'transient'],
    [new Error('socket hang up'), 'transient'],
  ])('%j → %s', (e, kind) => {
    expect(classifyError(e).kind).toBe(kind);
  });
});

describe('backoffMs', () => {
  it('지수적으로 증가하고 60초에서 멈춘다', () => {
    const zero = () => 0;
    expect([0, 1, 2, 3, 5, 6, 20].map((n) => backoffMs(n, zero))).toEqual([1000, 2000, 4000, 8000, 32000, 60000, 60000]);
  });

  it('jitter는 0~1초', () => {
    expect(backoffMs(0, () => 0.999)).toBe(1999);
  });
});
