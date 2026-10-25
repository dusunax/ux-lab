import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, type Api } from '../shared/ipc';

const subscribe = <T>(channel: string, cb: (payload: T) => void) => {
  const listener = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => void ipcRenderer.removeListener(channel, listener);
};

const api: Api = {
  getState: () => ipcRenderer.invoke(IPC.getState),
  onState: (cb) => subscribe(IPC.state, cb),
  onFinished: (cb) => subscribe(IPC.finished, cb),
  command: (cmd) => ipcRenderer.send(IPC.command, cmd),
  openSettings: () => ipcRenderer.send(IPC.openSettings),
};

contextBridge.exposeInMainWorld('api', api);
