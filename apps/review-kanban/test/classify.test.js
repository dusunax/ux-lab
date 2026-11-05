const test = require('node:test');
const assert = require('node:assert');
const { classify, normalizeBase } = require('../src/common');
const { reviewerNotes } = require('../src/gitlab');

const mr = (o) => ({ state: 'opened', labels: [], merge_status: 'can_be_merged', ...o });

test('merged 우선', () => {
  assert.equal(classify(mr({ state: 'merged' }), { approvedCount: 0, pipeline: null, needed: 1 }), 'merged');
});
test('승인 수 충족 → approved(ready)', () => {
  assert.equal(classify(mr(), { approvedCount: 1, pipeline: null, needed: 1, reviewed: true }), 'ready');
});
test('파이프라인·충돌과 무관하게 승인되면 approved', () => {
  assert.equal(classify(mr({ merge_status: 'cannot_be_merged' }), { approvedCount: 1, pipeline: 'failed', needed: 1, reviewed: false }), 'ready');
});
test('필요 승인 수가 0이어도 승인 0명이면 approved 아님', () => {
  assert.equal(classify(mr(), { approvedCount: 0, pipeline: 'success', needed: 0, reviewed: true }), 'review');
});
test('승인 수 미달 → approved 아님', () => {
  assert.equal(classify(mr(), { approvedCount: 1, pipeline: 'success', needed: 2, reviewed: true }), 'review');
});
test('다른 사람 댓글 있고 승인 미달 → review', () => {
  assert.equal(classify(mr(), { approvedCount: 0, pipeline: 'success', needed: 1, reviewed: true }), 'review');
});
test('다른 사람 댓글 없으면 draft', () => {
  assert.equal(classify(mr(), { approvedCount: 0, pipeline: null, needed: 1, reviewed: false }), 'draft');
});
test('http URL 허용, 그 외 거부', () => {
  assert.equal(normalizeBase('http://gl.local/'), 'http://gl.local');
  assert.throws(() => normalizeBase('file:///etc'));
});
test('reviewerNotes: 시스템 노트·작성자 본인 댓글 제외', () => {
  const notes = [
    { system: true, author: { id: 2 } },
    { system: false, author: { id: 1 } },
    { system: false, author: { id: 2 } },
  ];
  assert.equal(reviewerNotes(notes, 1).length, 1);
  assert.equal(reviewerNotes([], 1).length, 0);
});
