import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app, safeStorage } from 'electron';

/**
 * TypeSafe API 키 보관. 빌드 결과물에 키를 넣지 않는다.
 * - 개발: 실행 환경의 TYPESAFE_API_KEY (빌드 때 박히는 import.meta.env가 아니라 런타임 process.env)
 * - 앱: 콘솔에서 붙여 넣은 키를 safeStorage(macOS 키체인 기반)로 암호화해 userData에 저장
 * 키 값은 main 밖(renderer)으로 돌려보내지 않는다.
 */

const FILE = 'typesafe.key';
const KEY_RE = /^\S{16,300}$/;

const file = () => join(app.getPath('userData'), FILE);

export const typesafeKey = {
  get(): string | null {
    const fromEnv = process.env.TYPESAFE_API_KEY?.trim();
    if (fromEnv) return fromEnv;
    if (!existsSync(file()) || !safeStorage.isEncryptionAvailable()) return null;
    try {
      return safeStorage.decryptString(readFileSync(file()));
    } catch {
      return null;
    }
  },

  /** 형식이 맞고 암호화할 수 있을 때만 저장한다 */
  set(raw: unknown): boolean {
    const key = typeof raw === 'string' ? raw.trim() : '';
    if (!KEY_RE.test(key) || !safeStorage.isEncryptionAvailable()) return false;
    writeFileSync(file(), safeStorage.encryptString(key), { mode: 0o600 });
    return true;
  },

  clear(): void {
    rmSync(file(), { force: true });
  },

  /** 어디서 왔는지 (콘솔 표시용, 값은 노출하지 않음) */
  source(): 'env' | 'stored' | null {
    if (process.env.TYPESAFE_API_KEY?.trim()) return 'env';
    return existsSync(file()) ? 'stored' : null;
  },
};
