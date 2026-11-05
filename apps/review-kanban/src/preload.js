const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (c) => ipcRenderer.invoke('config:save', c),
  testConnection: (c) => ipcRenderer.invoke('config:test', c),
  refresh: () => ipcRenderer.invoke('board:refresh'),
  openUrl: (u) => ipcRenderer.invoke('open:url', u),
  fit: (h) => ipcRenderer.invoke('win:fit', h),
  resize: (w, h, final) => ipcRenderer.invoke('win:resize', w, h, final),
  autoHeight: () => ipcRenderer.invoke('win:autoheight'),
  setPref: (key, value) => ipcRenderer.invoke('ui:pref', key, value),
  quit: () => ipcRenderer.invoke('win:close'),
  onBoard: (cb) => ipcRenderer.on('board:update', (_e, data) => cb(data)),
});
