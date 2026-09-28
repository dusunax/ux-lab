import { safeStorage } from 'electron';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Credentials } from 'google-auth-library';

/**
 * OAuth Token 저장소.
 * safeStorage(macOS Keychain / Windows DPAPI)로 암호화해 userData/tokens.bin에 저장한다.
 * 암호화를 쓸 수 없는 환경이면 디스크에 저장하지 않는다 (재실행 시 재로그인).
 */
export class TokenStore {
  private readonly file: string;

  constructor(dir: string) {
    this.file = join(dir, 'tokens.bin');
  }

  load(): Credentials | null {
    if (!existsSync(this.file) || !safeStorage.isEncryptionAvailable()) return null;
    try {
      return JSON.parse(safeStorage.decryptString(readFileSync(this.file))) as Credentials;
    } catch {
      console.error('[token] 복호화 실패, 저장된 token 삭제');
      this.clear();
      return null;
    }
  }

  save(tokens: Credentials): void {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('[token] safeStorage 사용 불가, token을 디스크에 저장하지 않음');
      return;
    }
    writeFileSync(this.file, safeStorage.encryptString(JSON.stringify(tokens)), { mode: 0o600 });
  }

  clear(): void {
    rmSync(this.file, { force: true });
  }
}
