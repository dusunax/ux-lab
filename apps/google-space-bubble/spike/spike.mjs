// Phase 0 spike: Google Chat API 사용자 인증 응답 확인용
// 실행: node --env-file=.env spike.mjs   (원본 출력: RAW=1 node --env-file=.env spike.mjs)
// 토큰은 메모리에만 유지하고 디스크에 저장하지 않는다.
import http from 'node:http';
import { execFile } from 'node:child_process';
import { OAuth2Client } from 'google-auth-library';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SPACE_IDS } = process.env;
if (!GOOGLE_CLIENT_ID || !SPACE_IDS) {
  console.error('.env에 GOOGLE_CLIENT_ID, SPACE_IDS를 설정하세요 (.env.example 참고)');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/chat.messages.readonly', 'openid', 'email'];

// 공유해도 되도록 개인정보 마스킹 (RAW=1 이면 원본 출력)
const RAW = process.env.RAW === '1';
const mask = (s, keep = 2) => (RAW || !s ? s : s.slice(0, keep) + '***');
const maskId = (s) => (RAW || !s ? s : s.replace(/\/(\d{4})\d+/, '/$1***'));

// Space ID 또는 Chat URL을 spaces/XXXX 형태로 정규화
function normalizeSpaceId(input) {
  const s = input.trim();
  const m = s.match(/(?:spaces\/|room\/|space\/)([A-Za-z0-9_-]+)/);
  return m ? `spaces/${m[1]}` : `spaces/${s}`;
}

// loopback redirect + PKCE (Desktop OAuth client)
async function login() {
  const server = http.createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const redirectUri = `http://127.0.0.1:${server.address().port}`;

  const client = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri,
  });
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  const state = crypto.randomUUID();
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  const code = await new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      const url = new URL(req.url, redirectUri);
      if (url.pathname !== '/') return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (url.searchParams.get('state') !== state) {
        res.end('state 불일치');
        return reject(new Error('state mismatch'));
      }
      if (url.searchParams.get('error')) {
        res.end('로그인 취소/실패. 창을 닫아도 됩니다.');
        return reject(new Error(url.searchParams.get('error')));
      }
      res.end('로그인 완료. 창을 닫고 터미널로 돌아가세요.');
      resolve(url.searchParams.get('code'));
    });
    console.log('브라우저에서 로그인하세요...');
    execFile(process.platform === 'win32' ? 'explorer' : 'open', [authUrl]);
  }).finally(() => server.close());

  const { tokens } = await client.getToken({ code, codeVerifier });
  client.setCredentials(tokens);
  console.log('refresh_token 수신:', Boolean(tokens.refresh_token));

  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID });
  const { sub, email } = ticket.getPayload();
  return { client, me: { userName: `users/${sub}`, email } };
}

async function listMessages(client, space, params) {
  const url = new URL(`https://chat.googleapis.com/v1/${space}/messages`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await client.request({ url: url.toString() });
  return res.data.messages ?? [];
}

const { client, me } = await login();
console.log('ID Token sub →', maskId(me.userName));
const selfCheck = { byName: false, byEmail: false };

for (const raw of SPACE_IDS.split(',')) {
  const space = normalizeSpaceId(raw);
  console.log(`\n=== ${space} ===`);
  try {
    // 1) 최신 메시지 (최초 동기화 기준점)
    const latest = await listMessages(client, space, { pageSize: '5', orderBy: 'createTime desc' });
    for (const m of latest) {
      const s = m.sender ?? {};
      const isMeByName = s.name === me.userName;
      const isMeByEmail = s.type === 'HUMAN' && s.email === me.email;
      selfCheck.byName ||= isMeByName;
      selfCheck.byEmail ||= isMeByEmail;
      console.log({
        createTime: m.createTime,
        sender: {
          name: maskId(s.name),
          displayName: mask(s.displayName),
          type: s.type,
          hasEmail: Boolean(s.email),
        },
        isMeByName,
        isMeByEmail,
        text: RAW ? m.text?.slice(0, 60) : `(${m.text?.length ?? 0}자)`,
      });
    }

    // 2) createTime 필터 동작 확인
    if (latest.length > 1) {
      const since = latest.at(-1).createTime;
      const newer = await listMessages(client, space, {
        filter: `createTime > "${since}"`,
        orderBy: 'createTime asc',
        pageSize: '10',
      });
      console.log(`filter createTime > ${since} → ${newer.length}건`);
    }
  } catch (e) {
    console.error('실패:', e.response?.status, e.response?.data?.error?.message ?? e.message);
  }
}

console.log('\n=== 본인 식별 결과 ===');
console.log('sub === sender.name 일치한 메시지 있음:', selfCheck.byName);
console.log('email 일치한 메시지 있음:', selfCheck.byEmail);
if (!selfCheck.byName && !selfCheck.byEmail) {
  console.log('→ 최근 메시지 중 본인 메시지가 없습니다. Space에 메시지를 하나 보낸 뒤 다시 실행하세요.');
}
