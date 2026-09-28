import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { LIMITS, type AppState, type SpaceView } from '../../../shared/types';
import { MascotImage } from '../../Mascot';
import { AppearanceSettings } from './AppearanceSettings';

const STATUS_LABEL: Record<SpaceView['status'], string> = {
  idle: '대기',
  syncing: '동기화 중',
  ok: '정상',
  waiting: '연결 대기 중',
  error: '오류',
};

export function Settings({ state }: { state: AppState }) {
  const { auth, spaces, monitoring, connection } = state;
  const email = auth.status === 'signedIn' ? auth.email : '';
  const paused = monitoring === 'paused';

  return (
    <main className="settings">
      <header className="settings-header">
        <div>
          <h1>Google Space</h1>
          <p className="muted small">{email}</p>
        </div>
        <button className="btn btn-ghost small" onClick={() => void window.api.logout()}>
          로그아웃
        </button>
      </header>

      <StatusBar paused={paused} waiting={connection === 'waiting'} count={spaces.filter((s) => s.enabled).length} />

      <ul className="space-list">
        {spaces.length === 0 && (
          <li className="empty muted">
            <MascotImage mascot="wave" size={72} />
            <span>등록된 Space가 없습니다. 아래에서 추가하세요.</span>
          </li>
        )}
        {spaces.map((s) => (
          <SpaceRow key={s.spaceId} space={s} />
        ))}
      </ul>

      {spaces.length < LIMITS.maxSpaces ? (
        <AddSpaceForm />
      ) : (
        <p className="muted small">Space는 최대 {LIMITS.maxSpaces}개까지 등록할 수 있습니다.</p>
      )}

      <AppearanceSettings settings={state.settings} />

      <footer className="settings-footer">
        <button className="btn" onClick={() => void window.api.testBubble()}>
          테스트 알림 보내기
        </button>
        <button
          className={`btn ${paused ? 'btn-primary' : ''}`}
          disabled={spaces.length === 0}
          onClick={() => void window.api.setMonitoring(paused)}
        >
          {paused ? '모니터링 시작' : '모니터링 일시정지'}
        </button>
      </footer>
    </main>
  );
}

function StatusBar({ paused, waiting, count }: { paused: boolean; waiting: boolean; count: number }) {
  const [cls, label] =
    paused ? ['paused', '모니터링 일시정지됨']
    : waiting ? ['waiting', 'Google Chat 연결 대기 중']
    : count === 0 ? ['paused', '모니터링할 Space 없음']
    : ['ok', `모니터링 중 · Space ${count}개`];
  return (
    <p className={`status status-${cls}`} role="status">
      <span className="dot" aria-hidden />
      {label}
    </p>
  );
}

function SpaceRow({ space }: { space: SpaceView }) {
  const status = space.enabled ? space.status : 'idle';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(space.spaceName);

  const startEdit = () => {
    setDraft(space.spaceName);
    setEditing(true);
  };
  const save = () => {
    setEditing(false);
    if (draft.trim() !== space.spaceName) void window.api.renameSpace(space.spaceId, draft);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중 Enter 무시
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <li className="space-row">
      {editing ? (
        <div className="space-main">
          <input
            className="rename-input"
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={save}
            aria-label="Space 표시 이름"
          />
        </div>
      ) : (
        <label className="space-main">
          <input
            type="checkbox"
            checked={space.enabled}
            onChange={(e) => void window.api.setSpaceEnabled(space.spaceId, e.target.checked)}
          />
          <span className="space-text">
            <span className="space-name">{space.spaceName}</span>
            <span className="space-id muted small">{space.spaceId}</span>
          </span>
        </label>
      )}
      {!editing && (
        <button
          className="btn btn-ghost small icon"
          aria-label={`${space.spaceName} 이름 변경`}
          title="이름 변경"
          onClick={startEdit}
        >
          ✎
        </button>
      )}
      {space.enabled && (
        <span className={`badge badge-${status}`} title={space.error}>
          {STATUS_LABEL[status]}
        </span>
      )}
      {space.enabled && status === 'error' && (
        <button className="btn btn-ghost small" onClick={() => void window.api.retrySpace(space.spaceId)}>
          재시도
        </button>
      )}
      <button
        className="btn btn-ghost small icon"
        aria-label={`${space.spaceName} 삭제`}
        title="삭제"
        onClick={() => {
          if (confirm(`'${space.spaceName}' Space를 삭제할까요?`)) void window.api.removeSpace(space.spaceId);
        }}
      >
        ✕
      </button>
      {space.enabled && status === 'error' && space.error && <p className="error small space-error">{space.error}</p>}
    </li>
  );
}

function AddSpaceForm() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setOpen(false);
    setInput('');
    setName('');
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await window.api.addSpace(input, name);
    setBusy(false);
    if (res.ok) reset();
    else setError(res.error);
  };

  if (!open) {
    return (
      <button className="btn add-btn" onClick={() => setOpen(true)}>
        + Space 추가
      </button>
    );
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <label>
        <span className="small">Space ID 또는 URL</span>
        <input
          autoFocus
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="spaces/AAAA… 또는 https://chat.google.com/room/AAAA…"
        />
      </label>
      <label>
        <span className="small">표시 이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gen.AI Front-end 알림" maxLength={80} />
      </label>
      {error && (
        <p className="error small" role="alert">
          {error}
        </p>
      )}
      <div className="add-actions">
        <button type="button" className="btn" onClick={reset} disabled={busy}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          {busy ? '확인 중…' : '추가'}
        </button>
      </div>
    </form>
  );
}
