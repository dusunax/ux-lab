const test = require('node:test');
const assert = require('node:assert');
const { apiBase, webBase, approvedCount, reviewerActivity, checkStatus } = require('../src/github');

const AUTHOR = 1;
const review = (id, state, at = '2026-11-05T01:00:00Z', type = 'User') => ({ user: { id, type }, state, submitted_at: at });

test('apiBase: 빈 값·github.com은 api.github.com, Enterprise는 /api/v3 붙이기', () => {
  assert.equal(apiBase(''), 'https://api.github.com');
  assert.equal(apiBase('https://github.com/'), 'https://api.github.com');
  assert.equal(apiBase('https://ghe.example.local/'), 'https://ghe.example.local/api/v3');
  assert.equal(apiBase('https://ghe.example.local/api/v3'), 'https://ghe.example.local/api/v3');
  assert.throws(() => apiBase('file:///etc'));
});
test('webBase: github.com과 Enterprise API 주소를 웹 주소로', () => {
  assert.equal(webBase('https://api.github.com'), 'https://github.com');
  assert.equal(webBase('https://ghe.example.local/api/v3/'), 'https://ghe.example.local');
  assert.equal(webBase('http://127.0.0.1:8080'), 'http://127.0.0.1:8080');
});
test('approvedCount: 리뷰어별 마지막 결론만, 작성자 제외', () => {
  const reviews = [
    review(2, 'APPROVED'),
    review(2, 'CHANGES_REQUESTED'), // 나중 결론이 승인을 덮는다
    review(3, 'APPROVED'),
    review(3, 'COMMENTED'), // 댓글 리뷰는 승인을 취소하지 않는다
    review(AUTHOR, 'APPROVED'),
  ];
  assert.equal(approvedCount(reviews, AUTHOR), 1);
  assert.equal(approvedCount([], AUTHOR), 0);
});
test('reviewerActivity: 작성자·봇·PENDING 제외, 시각순', () => {
  const comments = [
    { user: { id: AUTHOR, type: 'User' }, created_at: '2026-11-05T00:00:00Z' },
    { user: { id: 9, type: 'Bot' }, created_at: '2026-11-05T00:10:00Z' },
    { user: { id: 2, type: 'User' }, created_at: '2026-11-05T03:00:00Z' },
  ];
  const reviews = [review(3, 'APPROVED', '2026-11-05T02:00:00Z'), review(4, 'PENDING', null)];
  assert.deepEqual(reviewerActivity(comments, reviews, AUTHOR), ['2026-11-05T02:00:00Z', '2026-11-05T03:00:00Z']);
});
test('checkStatus: 실패 우선, 진행 중, 성공, 없음', () => {
  assert.equal(checkStatus([]), null);
  assert.equal(checkStatus([{ status: 'in_progress' }, { status: 'completed', conclusion: 'failure' }]), 'failed');
  assert.equal(checkStatus([{ status: 'queued' }, { status: 'completed', conclusion: 'success' }]), 'running');
  assert.equal(checkStatus([{ status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'skipped' }]), 'success');
});
