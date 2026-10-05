import '@fontsource/silkscreen/400.css';
import '@fontsource/nanum-gothic-coding/700.css';
import './device.css';
import { createMic } from './mic';
import { createRig } from './rig';

/** OQ-3: 기억은 이 창의 localStorage에 저장한다. 뇌(main)는 값을 받아 검증한 뒤 쓴다 */
const MEMORY_KEY = 'tuffy.memory';

function readMemory(): unknown {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const rig = createRig();
const mic = createMic(
  (sig) => window.api.sendMicSignal(sig),
  (clip, humHz) => window.api.sendSpeechClip(clip, humHz),
  (stats) => window.api.sendMicStats(stats),
  () => window.api.sendSpeechStart(),
);

window.api.onBody((b) => rig.setBody(b));
window.api.onAct((e) => rig.act(e));
window.api.onMemory((m) => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
  } catch {
    // 저장 실패 시 이번 세션 기억만 유지된다
  }
});
window.api.onDeviceCmd(async (cmd) => {
  if (cmd.sound !== undefined) rig.setSound(cmd.sound);
  if (cmd.mic !== undefined) {
    const live = cmd.mic ? await mic.start() : (mic.stop(), false);
    rig.setMicLive(live);
  }
  mic.setSpeech(!!cmd.speech);
});

window.api.deviceReady(readMemory());
