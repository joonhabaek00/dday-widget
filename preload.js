const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadDdays: () => ipcRenderer.invoke('load-ddays'),
  saveDdays: (ddays) => ipcRenderer.invoke('save-ddays', ddays),
  getOpacity: () => ipcRenderer.invoke('get-opacity'),
  setOpacity: (value) => ipcRenderer.invoke('set-opacity', value),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
  hideWindow: () => ipcRenderer.send('hide-window'),
  quitApp: () => ipcRenderer.send('quit-app'),
});
