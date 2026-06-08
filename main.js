const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

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
    icon: path.join(__dirname, 'assets', 'icon.png'),
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
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath) .resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('🍅 番茄钟');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
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
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────
ipcMain.on('show-notification', (_event, title, body) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, 'assets', 'icon.png'),
    });
    notification.show();
    notification.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
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
