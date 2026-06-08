const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', title, body);
  },
  quitApp: () => {
    ipcRenderer.send('quit-app');
  },
  minimizeToTray: () => {
    ipcRenderer.send('minimize-to-tray');
  },
  setAlwaysOnTop: (onTop) => {
    ipcRenderer.send('set-always-on-top', onTop);
  },
  getAlwaysOnTop: () => {
    return ipcRenderer.sendSync('get-always-on-top');
  },
});
