import type { AuthState } from '../../../shared/types';
import mascot from '../../assets/mascot-wave.png';

export function Login({ auth }: { auth: Exclude<AuthState, { status: 'signedIn' }> }) {
  const signingIn = auth.status === 'signingIn';

  return (
    <main className="login">
      <img className={`login-mascot ${signingIn ? 'bounce' : ''}`} src={mascot} alt="" width={128} height={128} />
      <h1>Space Bubble</h1>
      <p className="muted">Google Chat Space의 새 메시지를 화면에 말풍선으로 알려드려요.</p>

      {signingIn ? (
        <>
          <p className="login-wait">브라우저에서 Google 로그인을 완료하세요…</p>
          <button className="btn" onClick={() => window.api.cancelLogin()}>
            취소
          </button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={() => void window.api.login()}>
          Google 계정으로 로그인
        </button>
      )}

      {auth.status === 'signedOut' && auth.error && (
        <p className="error" role="alert">
          {auth.error}
        </p>
      )}

      <p className="muted small">메시지 읽기 권한과 로그인 계정 확인(이메일)만 요청합니다.</p>
    </main>
  );
}
