import { EventEmitter } from 'node:events';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';
import { CodeChallengeMethod, OAuth2Client, type Credentials } from 'google-auth-library';
import type { AuthState } from '../../shared/types';
import type { Account, AppStore } from '../store/app-store';
import type { TokenStore } from './token-store';

const SCOPES = ['https://www.googleapis.com/auth/chat.messages.readonly', 'openid', 'email'];
const LOGIN_TIMEOUT_MS = 3 * 60 * 1000;

const CLIENT_ID = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET;

const html = (msg: string) =>
  `<!doctype html><meta charset="utf-8"><title>Space Bubble</title>` +
  `<body style="font-family:system-ui;display:grid;place-items:center;height:90vh;color:#333">` +
  `<p>${msg}</p></body>`;

/** Refresh Token이 무효화된 경우 (비밀번호 변경, 권한 철회 등) */
export function isInvalidGrant(e: unknown): boolean {
  const err = e as { message?: string; response?: { data?: { error?: string } } };
  return err?.response?.data?.error === 'invalid_grant' || /invalid_grant/.test(err?.message ?? '');
}

/**
 * Google OAuth 로그인과 Token 수명주기를 관리한다.
 * - 시스템 브라우저 + loopback redirect + PKCE(S256) + state
 * - Token은 TokenStore(safeStorage)에만 저장하고 Renderer로 보내지 않는다.
 */
export class AuthManager extends EventEmitter<{ change: [AuthState] }> {
  private _state: AuthState = { status: 'signedOut' };
  private client: OAuth2Client | null = null;
  private cancelLogin: (() => void) | null = null;

  constructor(
    private readonly tokens: TokenStore,
    private readonly store: AppStore,
  ) {
    super();
    if (!CLIENT_ID) {
      console.error('[auth] MAIN_VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다 (.env 확인)');
    }
  }

  get state(): AuthState {
    return this._state;
  }

  get account(): Account | undefined {
    return this.store.settings.account;
  }

  /** 로그인된 OAuth2Client. 로그아웃 상태면 null */
  get authClient(): OAuth2Client | null {
    return this._state.status === 'signedIn' ? this.client : null;
  }

  private setState(state: AuthState) {
    this._state = state;
    this.emit('change', state);
  }

  private createClient(redirectUri?: string): OAuth2Client {
    const client = new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri });
    // 갱신된 access token 저장. 갱신 응답에는 refresh_token이 없으므로 기존 값과 병합한다.
    client.on('tokens', (t) => {
      const merged: Credentials = { ...client.credentials, ...t };
      this.tokens.save(merged);
    });
    return client;
  }

  /** 앱 시작 시 저장된 token으로 자동 로그인 */
  async restore(): Promise<void> {
    const saved = this.tokens.load();
    const account = this.account;
    if (!saved?.refresh_token || !account) return;

    const client = this.createClient();
    client.setCredentials(saved);
    try {
      await client.getAccessToken();
    } catch (e) {
      if (isInvalidGrant(e)) {
        console.warn('[auth] refresh token 무효, 재로그인 필요');
        this.clearSession();
        this.setState({ status: 'signedOut', error: '로그인이 만료되었습니다. 다시 로그인해 주세요.' });
        return;
      }
      // 네트워크 오류 등은 로그인 상태를 유지하고 polling 쪽에서 재시도한다.
      console.warn('[auth] token 갱신 실패 (재시도 예정):', (e as Error).message);
    }
    this.client = client;
    this.setState({ status: 'signedIn', email: account.email });
  }

  async login(): Promise<void> {
    if (this._state.status === 'signingIn') return;
    if (!CLIENT_ID) {
      this.setState({ status: 'signedOut', error: 'OAuth Client ID가 설정되지 않았습니다.' });
      return;
    }
    this.setState({ status: 'signingIn' });
    try {
      const { client, account } = await this.runLoopbackFlow();
      this.client = client;
      this.store.setAccount(account);
      this.setState({ status: 'signedIn', email: account.email });
    } catch (e) {
      const msg = (e as Error).message;
      console.warn('[auth] 로그인 실패:', msg);
      this.setState({
        status: 'signedOut',
        error:
          msg === 'cancelled' ? undefined
          : msg === 'timeout' ? '로그인 시간이 초과되었습니다.'
          : msg === 'access_denied' ? '권한 승인이 취소되었습니다.'
          : '로그인에 실패했습니다.',
      });
    } finally {
      this.cancelLogin = null;
    }
  }

  private async runLoopbackFlow(): Promise<{ client: OAuth2Client; account: Account }> {
    const server = http.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const client = this.createClient(redirectUri);
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const state = randomUUID();
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      code_challenge_method: CodeChallengeMethod.S256,
      code_challenge: codeChallenge,
      state,
    });

    let timer: NodeJS.Timeout | undefined;
    try {
      const code = await new Promise<string>((resolve, reject) => {
        this.cancelLogin = () => reject(new Error('cancelled'));
        timer = setTimeout(() => reject(new Error('timeout')), LOGIN_TIMEOUT_MS);
        server.on('request', (req, res) => {
          const url = new URL(req.url ?? '/', redirectUri);
          if (url.pathname !== '/') return void res.writeHead(404).end();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          if (url.searchParams.get('state') !== state) {
            res.end(html('잘못된 요청입니다.'));
            return; // 다른 요청은 무시하고 계속 대기
          }
          const error = url.searchParams.get('error');
          if (error) {
            res.end(html('로그인이 취소되었습니다. 이 창을 닫아도 됩니다.'));
            return reject(new Error(error));
          }
          res.end(html('로그인 완료. 이 창을 닫고 앱으로 돌아가세요.'));
          resolve(url.searchParams.get('code') ?? '');
        });
        void shell.openExternal(authUrl);
      });

      const { tokens } = await client.getToken({ code, codeVerifier });
      if (!tokens.refresh_token || !tokens.id_token) throw new Error('missing token');
      client.setCredentials(tokens);
      this.tokens.save(tokens);

      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) throw new Error('missing id token claims');
      return { client, account: { userName: `users/${payload.sub}`, email: payload.email } };
    } finally {
      clearTimeout(timer);
      server.close();
    }
  }

  /** 진행 중인 로그인 대기를 취소 */
  cancel(): void {
    this.cancelLogin?.();
  }

  async logout(): Promise<void> {
    const refresh = this.client?.credentials.refresh_token;
    if (refresh) {
      await this.client!.revokeToken(refresh).catch((e) => console.warn('[auth] revoke 실패:', e.message));
    }
    this.clearSession();
    this.setState({ status: 'signedOut' });
  }

  /** Refresh token 무효화 감지 시 호출 (poller 등) */
  handleInvalidGrant(): void {
    if (this._state.status !== 'signedIn') return;
    this.clearSession();
    this.setState({ status: 'signedOut', error: '로그인이 만료되었습니다. 다시 로그인해 주세요.' });
  }

  private clearSession(): void {
    this.client?.removeAllListeners('tokens');
    this.client = null;
    this.tokens.clear();
    this.store.setAccount(undefined);
  }
}
