import electron from 'electron';
const { app, BrowserWindow } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import IpcManager from './IpcManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Path to the application's package.json file.
 * @type {string}
 */
const packageJsonPath = path.join(__dirname, '../../package.json');
/**
 * Content of the application's package.json file.
 * @type {object}
 */
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
/**
 * The current version of the application, extracted from package.json.
 * @type {string}
 */
const appVersion = packageJson.version;

/**
 * The main Electron BrowserWindow instance.
 * @type {Electron.BrowserWindow}
 */
let win;

/**
 * Creates the main Electron browser window.
 * @returns {electron.BrowserWindow} The created BrowserWindow instance.
 */
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 640,
    minHeight: 360,
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('src/renderer/index.html');
  return win;
}

// When the Electron app is ready, create the window and set up IPC handlers.
/**
 * Event listener for when the Electron app is ready.
 * Creates the main window and initializes the IPC manager.
 */
app.whenReady().then(() => {
  const win = createWindow();
  const ipcManager = new IpcManager(win, appVersion);
  ipcManager.setupIpcHandlers();

  /**
   * Event listener for when the application is activated (e.g., clicking on the dock icon).
   * If no windows are open, a new one is created.
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/**
 * Event listener for when all windows of the application are closed.
 * On Windows and Linux, the application quits when all windows are closed.
 * On macOS, applications typically stay active until the user quits explicitly.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
