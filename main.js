const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(app.getPath('userData'), 'data.json');
const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

let win = null;
let tray = null;

// ---------- data persistence ----------
function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ddays: Array.isArray(parsed.ddays) ? parsed.ddays : [],
      bounds: parsed.bounds || null,
      autoLaunchInitialized: !!parsed.autoLaunchInitialized,
    };
  } catch {
    return { ddays: [], bounds: null, autoLaunchInitialized: false };
  }
}

function writeData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write data:', err);
  }
}

// ---------- auto-launch ----------
function setAutoLaunch(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: app.isPackaged ? [] : [path.resolve(app.getAppPath())],
  });
}

function getAutoLaunch() {
  return app.getLoginItemSettings().openAtLogin;
}

// ---------- window ----------
function createWindow() {
  const data = readData();
  const bounds = data.bounds;

  win = new BrowserWindow({
    width: bounds?.width || 300,
    height: bounds?.height || 380,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 240,
    minHeight: 200,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());

  // Persist window position/size (debounced).
  let saveTimer = null;
  const persistBounds = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const current = readData();
      current.bounds = win.getBounds();
      writeData(current);
    }, 400);
  };
  win.on('move', persistBounds);
  win.on('resize', persistBounds);
}

// ---------- tray ----------
function loadTrayIcon() {
  if (fs.existsSync(ICON_PATH)) {
    return nativeImage.createFromPath(ICON_PATH);
  }
  return nativeImage.createEmpty();
}

function createTray() {
  tray = new Tray(loadTrayIcon());
  tray.setToolTip('D-day 위젯');
  const menu = Menu.buildFromTemplate([
    {
      label: '보이기 / 숨기기',
      click: () => {
        if (!win) return;
        if (win.isVisible()) win.hide();
        else win.show();
      },
    },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (!win) return;
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

// ---------- IPC ----------
ipcMain.handle('load-ddays', () => readData().ddays);

ipcMain.handle('save-ddays', (_e, ddays) => {
  const current = readData();
  current.ddays = Array.isArray(ddays) ? ddays : [];
  writeData(current);
  return true;
});

ipcMain.handle('get-auto-launch', () => getAutoLaunch());

ipcMain.handle('set-auto-launch', (_e, enabled) => {
  setAutoLaunch(!!enabled);
  return getAutoLaunch();
});

ipcMain.on('hide-window', () => win && win.hide());
ipcMain.on('quit-app', () => app.quit());

// ---------- lifecycle ----------
app.whenReady().then(() => {
  // Enable auto-launch on first run only, so later user choice sticks.
  const data = readData();
  if (!data.autoLaunchInitialized) {
    setAutoLaunch(true);
    data.autoLaunchInitialized = true;
    writeData(data);
  }

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Keep running in the tray even when the window is hidden/closed.
app.on('window-all-closed', () => {
  // Intentionally do nothing: the widget lives in the tray.
});
