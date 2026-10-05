import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, type Api } from '../shared/ipc';

const subscribe = <T>(channel: string, cb: (payload: T) => void) => {
  const listener = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => void ipcRenderer.removeListener(channel, listener);
};

const api: Api = {
  deviceReady: (memory) => ipcRenderer.send(IPC.deviceReady, memory),
  sendMicSignal: (signal) => ipcRenderer.send(IPC.micSignal, signal),
  sendSpeechClip: (clip, humHz) => ipcRenderer.send(IPC.speechClip, clip, humHz),
  sendSpeechStart: () => ipcRenderer.send(IPC.speechStart),
  sendMicStats: (s) => ipcRenderer.send(IPC.micStats, s),
  onAct: (cb) => subscribe(IPC.act, cb),
  onMemory: (cb) => subscribe(IPC.memory, cb),
  onDeviceCmd: (cb) => subscribe(IPC.deviceCmd, cb),

  getSnapshot: () => ipcRenderer.invoke(IPC.getSnapshot),
  sendText: (text) => ipcRenderer.send(IPC.sendText, text),
  simulate: (kind) => ipcRenderer.send(IPC.simulate, kind),
  setMic: (on) => ipcRenderer.invoke(IPC.setMic, on),
  setSound: (on) => ipcRenderer.send(IPC.setSound, on),
  setEngine: (engine) => ipcRenderer.send(IPC.setEngine, engine),
  setTypesafeKey: (key) => ipcRenderer.invoke(IPC.setTypesafeKey, key),
  clearTypesafeKey: () => ipcRenderer.send(IPC.clearTypesafeKey),
  onUsage: (cb) => subscribe(IPC.usage, cb),
  onLog: (cb) => subscribe(IPC.log, cb),
  onCortex: (cb) => subscribe(IPC.cortex, cb),
  onMicDiag: (cb) => subscribe(IPC.micDiag, cb),
  onStt: (cb) => subscribe(IPC.stt, cb),

  onBody: (cb) => subscribe(IPC.body, cb),
  openConsole: () => ipcRenderer.send(IPC.openConsole),
};

contextBridge.exposeInMainWorld('api', api);
