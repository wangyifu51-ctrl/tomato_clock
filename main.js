const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

function showWindow() {
  mainWindow.show();
  mainWindow.focus();
}

// ─── Detect Dev / Prod ────────────────────────────────────────
const PROD_PATH = path.join(__dirname, 'dist', 'index.html');
const DEV_URL = 'http://localhost:5173';
const DEV_MODE = !fs.existsSync(PROD_PATH);

// ─── Window Creation ──────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 620,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    show: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (DEV_MODE) {
    mainWindow.loadURL(DEV_URL);
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(PROD_PATH);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── System Tray ──────────────────────────────────────────────
function createTray() {
  const trayIcon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('🍅 番茄钟');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: showWindow,
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', showWindow);
}

// ─── IPC Handlers ─────────────────────────────────────────────
ipcMain.on('show-notification', (_event, title, body) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: ICON_PATH,
    });
    notification.show();
    notification.on('click', showWindow);
  }
});

ipcMain.on('quit-app', () => {
  isQuitting = true;
  app.quit();
});

ipcMain.on('minimize-to-tray', () => {
  mainWindow.hide();
});

ipcMain.on('set-always-on-top', (_event, onTop) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(onTop);
  }
});

ipcMain.on('get-always-on-top', (event) => {
  if (mainWindow) {
    event.returnValue = mainWindow.isAlwaysOnTop();
  }
});

// ─── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else mainWindow.show();
});

app.on('before-quit', () => {
  isQuitting = true;
});
