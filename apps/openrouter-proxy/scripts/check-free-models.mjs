#!/usr/bin/env node
// 폴백 목록에 적힌 무료 모델이 OpenRouter에 아직 있는지 점검하고, 교체 후보와 함께 마크다운 보고서를 출력한다.
// 사용: node apps/openrouter-proxy/scripts/check-free-models.mjs > report.md
import { appendFileSync, readFileSync } from 'node:fs';

const ROOT = new URL('../../../', import.meta.url);

// 같은 무료 모델 목록을 들고 있는 파일들
const TARGETS = [
  'apps/openrouter-proxy/src/chat/fallback-models.json',
  'apps/ai-empathy-diary/api/chat.js',
];
const MODEL_ID = /["']([\w.-]+\/[\w.:-]+:free)["']/g;

const res = await fetch('https://openrouter.ai/api/v1/models');
if (!res.ok) {
  console.error(`OpenRouter 모델 목록 조회 실패: ${res.status}`);
  process.exit(1);
}
const { data: models } = await res.json();
const available = new Set(models.map((m) => m.id));

const listed = new Set();
const missingByFile = TARGETS.map((file) => {
  const source = readFileSync(new URL(file, ROOT), 'utf8');
  const ids = [...new Set([...source.matchAll(MODEL_ID)].map((m) => m[1]))];
  ids.forEach((id) => listed.add(id));
  return { file, missing: ids.filter((id) => !available.has(id)) };
});
const missingCount = missingByFile.reduce((n, f) => n + f.missing.length, 0);

const candidates = models
  .filter((m) => m.id.endsWith(':free') && !listed.has(m.id))
  .sort((a, b) => b.created - a.created);
const isImage = (m) => m.architecture?.input_modalities?.includes('image');
const row = (m) =>
  `| \`${m.id}\` | ${m.context_length?.toLocaleString('en-US') ?? '-'} | ${new Date(m.created * 1000).toISOString().slice(0, 10)} |`;
const table = (list) =>
  list.length
    ? ['| 모델 | context | 등록일 |', '|---|---|---|', ...list.map(row)].join('\n')
    : '없음';

const lines = [`OpenRouter \`/api/v1/models\` 기준 (${new Date().toISOString().slice(0, 10)})`, ''];
lines.push('## 사라진 모델', '');
for (const { file, missing } of missingByFile) {
  lines.push(`- \`${file}\`: ${missing.length ? missing.map((id) => `\`${id}\``).join(', ') : '이상 없음'}`);
}
lines.push('', '## 목록에 없는 무료 모델 (교체 후보)', '');
lines.push('### 이미지 입력 가능', '', table(candidates.filter(isImage)), '');
lines.push('### 텍스트 전용', '', table(candidates.filter((m) => !isImage(m))), '');
lines.push('> 안전 분류기·코드 전용 모델처럼 범용 대화에 맞지 않는 모델도 섞여 있으니 직접 호출해 보고 고르세요.');

console.log(lines.join('\n'));
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `missing=${missingCount}\n`);
