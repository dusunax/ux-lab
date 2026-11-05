const test = require('node:test');
const assert = require('node:assert');
const { tokenKind, tokenSlot, tokenHosts, missingRequired, parseApprovals, migrateTokens } = require('../src/common');

const GH = 'https://api.github.com';
const GHE = 'https://ghe.example.local/api/v3';
const GL = 'https://gitlab.example.local';

test('tokenKind: GitLab · github.com · Enterprise 구분', () => {
  assert.equal(tokenKind({ provider: 'gitlab', baseUrl: GL }), 'gitlab');
  assert.equal(tokenKind({ provider: 'github', baseUrl: GH }), 'github');
  assert.equal(tokenKind({ provider: 'github', baseUrl: GHE }), 'ghe');
});
test('tokenSlot: 칸이 다르거나 저장 당시 주소와 다르면 쓰지 않는다', () => {
  const tokens = { github: { enc: 'a', base: GH }, ghe: { enc: 'b', base: GHE } };
  assert.equal(tokenSlot({ provider: 'github', baseUrl: GH, tokens }).enc, 'a');
  assert.equal(tokenSlot({ provider: 'github', baseUrl: GHE, tokens }).enc, 'b');
  assert.equal(tokenSlot({ provider: 'gitlab', baseUrl: GL, tokens }), null);
  assert.equal(tokenSlot({ provider: 'github', baseUrl: 'https://other.local/api/v3', tokens }), null);
});
test('tokenHosts: 칸별 호스트만 내보내고 토큰은 담지 않는다', () => {
  const hosts = tokenHosts({ tokens: { github: { enc: 'a', base: GH }, ghe: { enc: 'b', base: GHE }, gitlab: { enc: '', base: GL } } });
  assert.deepEqual(hosts, { github: 'github.com', ghe: 'ghe.example.local' });
});
test('migrateTokens: 예전 tokenEnc를 그때 설정의 칸으로 옮긴다', () => {
  const cfg = migrateTokens({ provider: 'github', baseUrl: GH, tokenEnc: 'old', tokens: {} });
  assert.equal(cfg.tokenEnc, undefined);
  assert.deepEqual(cfg.tokens, { github: { enc: 'old', base: GH } });
  const same = { provider: 'gitlab', baseUrl: GL, tokens: {} };
  assert.equal(migrateTokens(same), same);
});
test('missingRequired: 주소·쓸 수 있는 토큰·담당자 ID가 모두 있어야 저장', () => {
  const tokens = { github: { enc: 'a', base: GH } };
  assert.deepEqual(missingRequired({ provider: 'github', baseUrl: GH, tokens, users: ['me'] }), []);
  assert.deepEqual(missingRequired({ provider: 'gitlab', baseUrl: '', tokens, users: ['me'] }), ['URL', '토큰']);
  assert.deepEqual(missingRequired({ provider: 'github', baseUrl: GHE, tokens, users: [] }), ['토큰', '담당자 ID']);
});
test('parseApprovals: 0은 그대로, 빈 값·숫자 아님은 1', () => {
  assert.equal(parseApprovals('0'), 0);
  assert.equal(parseApprovals(0), 0);
  assert.equal(parseApprovals('2'), 2);
  assert.equal(parseApprovals(''), 1);
  assert.equal(parseApprovals('abc'), 1);
  assert.equal(parseApprovals('-3'), 0);
});
