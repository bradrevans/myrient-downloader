import { ipcMain } from 'electron';
import { MYRIENT_BASE_URL } from '../shared/constants/appConstants.js';
import MyrientDataManager from './managers/MyrientDataManager.js';
import FilterManager from './managers/FilterManager.js';
import DownloadOperationManager from './managers/DownloadOperationManager.js';

import ShellManager from './managers/ShellManager.js';
import WindowManager from './managers/WindowManager.js';
import UpdateManager from './managers/UpdateManager.js';
import DownloadInfoService from './services/DownloadInfoService.js';
import DownloadService from './services/DownloadService.js';
import DownloadManager from './services/DownloadManager.js';

import ConsoleService from './services/ConsoleService.js';
import MyrientService from './services/MyrientService.js';

import FileParserService from './services/FileParserService.js';

/**
 * Manages Inter-Process Communication (IPC) between the main and renderer processes.
 * It registers handlers for various IPC channels to orchestrate application logic.
 * @class
 */
class IpcManager {
    /**
     * Creates an instance of IpcManager.
     * @param {Electron.BrowserWindow} win The Electron BrowserWindow instance.
     * @param {string} appVersion The current version of the application.
     */
    constructor(win, appVersion) {
        this.win = win;
        this.consoleService = new ConsoleService(win);
        const fileParserService = new FileParserService();
        const myrientService = new MyrientService(fileParserService);
        const downloadInfoService = new DownloadInfoService(myrientService);
        const downloadService = new DownloadService(this.consoleService);
        this.downloadManager = new DownloadManager(win, this.consoleService, downloadInfoService, downloadService);
                
        this.myrientDataManager = new MyrientDataManager(myrientService);        this.filterManager = new FilterManager();
        this.downloadOperationManager = new DownloadOperationManager(win, this.downloadManager);

        this.shellManager = new ShellManager();
        this.windowManager = new WindowManager(win);
        this.updateManager = new UpdateManager(appVersion);
    }

    /**
     * Sets up all IPC handlers for communication with the renderer process.
     */
    setupIpcHandlers() {
        /**
         * Handles the 'get-myrient-base-url' IPC call.
         * @memberof IpcManager
         * @returns {string} The base URL for Myrient.
         */
        ipcMain.handle('get-myrient-base-url', () => {

            return MYRIENT_BASE_URL;
        });
        /**
         * Handles the 'get-main-archives' IPC call.
         * @memberof IpcManager
         * @returns {Promise<Array<object>>} A promise that resolves with an array of main archives.
         */
        ipcMain.handle('get-main-archives', () => {

            return this.myrientDataManager.getMainArchives();
        });
        /**
         * Handles the 'get-directory-list' IPC call.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         * @returns {Promise<object>} A promise that resolves with the directory list.
         */
        ipcMain.handle('get-directory-list', (event, ...args) => {

            return this.myrientDataManager.getDirectoryList(...args);
        });
        /**
         * Handles the 'scrape-and-parse-files' IPC call.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         * @returns {Promise<object>} A promise that resolves with scraped and parsed file data.
         */
        ipcMain.handle('scrape-and-parse-files', (event, ...args) => {

            return this.myrientDataManager.scrapeAndParseFiles(...args);
        });
        /**
         * Handles the 'filter-files' IPC call.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         * @returns {Promise<object>} A promise that resolves with filtered file data.
         */
        ipcMain.handle('filter-files', (event, ...args) => {

            return this.filterManager.filterFiles(...args);
        });
        /**
         * Handles the 'get-download-directory' IPC call.
         * @memberof IpcManager
         * @returns {Promise<string|null>} A promise that resolves with the selected download directory or null if cancelled.
         */
        ipcMain.handle('get-download-directory', () => {

            return this.downloadOperationManager.getDownloadDirectory();
        });
        /**
         * Handles the 'check-download-directory-structure' IPC call.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         * @returns {Promise<object>} A promise that resolves with the download directory structure.
         */
        ipcMain.handle('check-download-directory-structure', (event, ...args) => {

            return this.downloadOperationManager.checkDownloadDirectoryStructure(...args);
        });
        /**
         * Handles the 'get-download-directory-structure-enum' IPC call.
         * @memberof IpcManager
         * @returns {Promise<object>} A promise that resolves with the download directory structure enum.
         */
        ipcMain.handle('get-download-directory-structure-enum', () => {

            return this.downloadOperationManager.getDownloadDirectoryStructureEnum();
        });
        /**
         * Handles the 'cancel-download' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('cancel-download', () => {

            this.downloadOperationManager.cancelDownload();
        });
        /**
         * Handles the 'start-download' IPC call.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         * @returns {Promise<object>} A promise that resolves when the download starts.
         */
        ipcMain.handle('start-download', (event, ...args) => {

            return this.downloadOperationManager.startDownload(...args);
        });

        /**
         * Handles the 'open-external' IPC message.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         */
        ipcMain.on('open-external', (event, ...args) => {

            this.shellManager.openExternal(...args);
        });
        /**
         * Handles the 'open-directory' IPC message.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         */
        ipcMain.on('open-directory', (event, ...args) => {

            this.shellManager.openDirectory(...args);
        });
        /**
         * Handles the 'window-minimize' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('window-minimize', () => {

            this.windowManager.minimize();
        });
        /**
         * Handles the 'window-maximize-restore' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('window-maximize-restore', () => {

            this.windowManager.maximizeRestore();
        });
        /**
         * Handles the 'window-close' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('window-close', () => {

            this.windowManager.close();
        });
        /**
         * Handles the 'zoom-in' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('zoom-in', () => {

            this.windowManager.zoomIn();
        });
        /**
         * Handles the 'zoom-out' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('zoom-out', () => {

            this.windowManager.zoomOut();
        });
        /**
         * Handles the 'zoom-reset' IPC message.
         * @memberof IpcManager
         */
        ipcMain.on('zoom-reset', () => {

            this.windowManager.zoomReset();
        });
        /**
         * Handles the 'get-zoom-factor' IPC call.
         * @memberof IpcManager
         * @returns {number} The current zoom factor.
         */
        ipcMain.handle('get-zoom-factor', () => {

            return this.windowManager.getZoomFactor();
        });
        /**
         * Handles the 'set-zoom-factor' IPC message.
         * @memberof IpcManager
         * @param {Electron.IpcMainEvent} event The IPC event.
         * @param {Array<any>} args Arguments passed from the renderer process.
         */
        ipcMain.on('set-zoom-factor', (event, ...args) => {

            this.windowManager.setZoomFactor(...args);
        });
        /**
         * Handles the 'get-app-version' IPC call.
         * @memberof IpcManager
         * @returns {string} The application version.
         */
        ipcMain.handle('get-app-version', () => {

            return this.updateManager.getAppVersion();
        });
        /**
         * Handles the 'check-for-updates' IPC call.
         * @memberof IpcManager
         * @returns {Promise<object>} A promise that resolves with update information.
         */
        ipcMain.handle('check-for-updates', () => {

            return this.updateManager.checkForUpdates();
        });
    }
}

export default IpcManager;

