import { BrowserWindow, dialog, nativeImage } from 'electron';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_SIZE = 256;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type ChooseResult = { ok: true } | { ok: false; error?: string };

/**
 * 사용자가 고른 이미지를 캐릭터로 쓴다.
 * 파일 경로는 renderer에서 받지 않고 main의 파일 선택 창에서만 받는다.
 * 256px 이하로 줄여 userData/custom-mascot.png로 저장하고, renderer에는 data URL로 전달한다.
 */
export class CustomMascot {
  private readonly file: string;
  private cache: string | null | undefined;

  constructor(dir: string) {
    this.file = join(dir, 'custom-mascot.png');
  }

  async choose(): Promise<ChooseResult> {
    const parent = BrowserWindow.getFocusedWindow();
    const options: Electron.OpenDialogOptions = {
      title: '캐릭터 이미지 선택',
      properties: ['openFile'],
      filters: [{ name: '이미지', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    };
    const res = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options);
    const path = res.filePaths[0];
    if (res.canceled || !path) return { ok: false };

    if (statSync(path).size > MAX_FILE_BYTES) return { ok: false, error: '20MB 이하의 이미지를 선택하세요.' };
    const img = nativeImage.createFromPath(path);
    if (img.isEmpty()) return { ok: false, error: '이미지를 읽을 수 없습니다. PNG 또는 JPG 파일을 선택하세요.' };

    const { width, height } = img.getSize();
    const scale = Math.min(1, MAX_SIZE / Math.max(width, height));
    const resized =
      scale < 1
        ? img.resize({ width: Math.round(width * scale), height: Math.round(height * scale), quality: 'best' })
        : img;
    writeFileSync(this.file, resized.toPNG());
    this.cache = undefined;
    return { ok: true };
  }

  dataUrl(): string | null {
    if (this.cache !== undefined) return this.cache;
    this.cache = existsSync(this.file) ? `data:image/png;base64,${readFileSync(this.file).toString('base64')}` : null;
    return this.cache;
  }
}
