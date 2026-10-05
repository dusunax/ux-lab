import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { SPEECH, encodeWav } from './speech';

/**
 * OQ-5: 로컬 STT = whisper.cpp의 whisper-server.
 * 모델을 한 번만 올려 두고 127.0.0.1에서만 받는다. 음성은 기기 밖으로 나가지 않는다.
 */

const PORT = 8178;
const BIN_CANDIDATES = ['/opt/homebrew/bin/whisper-server', '/usr/local/bin/whisper-server'];
const DEFAULT_MODEL = 'ggml-large-v3-turbo-q5_0.bin';
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 500;
const INFER_TIMEOUT_MS = 20_000;
/**
 * 짧은 "터피야!"가 "터키야"로 들리는 걸 막는다. 이름으로 끝나는 프롬프트("터피야.")는
 * 문장 앞의 호칭을 프롬프트의 연속으로 보고 지워 버려서, 목록 형태로 이름을 알려 준다.
 */
const NAME_PROMPT = '등장인물: 터피';

export interface WhisperPaths {
  bin: string;
  model: string;
}

export function resolveWhisper(): WhisperPaths | { missing: string } {
  const bin = import.meta.env.MAIN_VITE_WHISPER_BIN || BIN_CANDIDATES.find((p) => existsSync(p));
  if (!bin || !existsSync(bin)) return { missing: 'whisper-server 실행 파일 (brew install whisper.cpp)' };
  const model = import.meta.env.MAIN_VITE_WHISPER_MODEL || join(app.getPath('userData'), 'models', DEFAULT_MODEL);
  if (!existsSync(model)) return { missing: `모델 파일 ${model}` };
  return { bin, model };
}

export class Whisper {
  private proc: ChildProcess | null = null;
  private ready: Promise<boolean> | null = null;
  private busy = false;

  constructor(
    private readonly paths: WhisperPaths,
    private readonly note: (text: string) => void,
  ) {}

  /** 서버를 띄우고 모델 로드가 끝나면 true */
  start(): Promise<boolean> {
    if (this.ready) return this.ready;
    const started = Date.now();
    this.note(`whisper 로드 중 · ${this.paths.model.split('/').pop()}`);
    this.proc = spawn(this.paths.bin, [
      '-m', this.paths.model, '-l', 'ko', '--host', '127.0.0.1', '--port', String(PORT), '-nt', '-sns', '-nf', '-t', '4', '--prompt', NAME_PROMPT,
    ], { stdio: 'ignore' });
    this.proc.once('exit', (code) => {
      this.proc = null;
      this.ready = null;
      if (code) this.note(`whisper 종료 (code ${code})`);
    });
    this.ready = this.waitReady(started);
    return this.ready;
  }

  stop(): void {
    this.proc?.kill();
    this.proc = null;
    this.ready = null;
  }

  /** 한 번에 하나만 처리한다. 바쁘면 그 구간은 버린다 */
  async transcribe(clip: Float32Array): Promise<{ text: string; ms: number } | { failed: string }> {
    if (this.busy) return { failed: 'whisper 처리 중이라 버림' };
    if (!(await this.ready)) return { failed: 'whisper 준비 안 됨' };
    this.busy = true;
    const started = Date.now();
    try {
      const form = new FormData();
      form.append('file', new Blob([encodeWav(clip, SPEECH.sampleRate)], { type: 'audio/wav' }), 'clip.wav');
      form.append('response_format', 'json');
      form.append('temperature', '0');
      const res = await fetch(`http://127.0.0.1:${PORT}/inference`, { method: 'POST', body: form, signal: AbortSignal.timeout(INFER_TIMEOUT_MS) });
      if (!res.ok) return { failed: `whisper 응답 ${res.status}` };
      const data = (await res.json()) as { text?: unknown };
      return typeof data.text === 'string' ? { text: data.text, ms: Date.now() - started } : { failed: 'whisper 응답 형식 오류' };
    } catch {
      return { failed: 'whisper 호출 실패' };
    } finally {
      this.busy = false;
    }
  }

  private async waitReady(started: number): Promise<boolean> {
    while (Date.now() - started < READY_TIMEOUT_MS) {
      if (!this.proc) return false;
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(READY_POLL_MS) });
        if (res.ok) {
          this.note(`whisper 준비 완료 · ${((Date.now() - started) / 1000).toFixed(1)}s`);
          return true;
        }
      } catch {
        // 아직 모델 로드 중
      }
      await new Promise((r) => setTimeout(r, READY_POLL_MS));
    }
    this.note('whisper 준비 시간 초과');
    this.stop();
    return false;
  }
}
