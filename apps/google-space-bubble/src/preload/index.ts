import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, type Api } from '../shared/ipc';

const subscribe = <T>(channel: string, cb: (payload: T) => void) => {
  const listener = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => void ipcRenderer.removeListener(channel, listener);
};

const api: Api = {
  getState: () => ipcRenderer.invoke(IPC.getState),
  onState: (cb) => subscribe(IPC.stateChanged, cb),
  login: () => ipcRenderer.invoke(IPC.login),
  cancelLogin: () => ipcRenderer.send(IPC.cancelLogin),
  logout: () => ipcRenderer.invoke(IPC.logout),
  addSpace: (input, name) => ipcRenderer.invoke(IPC.addSpace, input, name),
  removeSpace: (spaceId) => ipcRenderer.invoke(IPC.removeSpace, spaceId),
  renameSpace: (spaceId, name) => ipcRenderer.invoke(IPC.renameSpace, spaceId, name),
  setSpaceEnabled: (spaceId, enabled) => ipcRenderer.invoke(IPC.setSpaceEnabled, spaceId, enabled),
  retrySpace: (spaceId) => ipcRenderer.invoke(IPC.retrySpace, spaceId),
  setMonitoring: (running) => ipcRenderer.invoke(IPC.setMonitoring, running),
  updateSettings: (patch) => ipcRenderer.invoke(IPC.updateSettings, patch),
  testBubble: () => ipcRenderer.invoke(IPC.testBubble),
  chooseCustomMascot: () => ipcRenderer.invoke(IPC.chooseCustomMascot),
  getCustomMascot: () => ipcRenderer.invoke(IPC.getCustomMascot),

  onBubble: (cb) => subscribe(IPC.bubblePush, cb),
  openSpace: (spaceId) => ipcRenderer.send(IPC.bubbleOpen, spaceId),
  setBubbleHover: (hover) => ipcRenderer.send(IPC.bubbleHover, hover),
  notifyBubbleEmpty: () => ipcRenderer.send(IPC.bubbleEmpty),
  notifyBubbleReady: () => ipcRenderer.send(IPC.bubbleReady),
};

contextBridge.exposeInMainWorld('api', api);
