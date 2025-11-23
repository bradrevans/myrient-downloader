/**
 * Provides a service for making IPC calls to the main process from the renderer process.
 * This class abstracts the `ipcRenderer.invoke` and `ipcRenderer.send` calls,
 * offering a clean API for renderer-side components to interact with main process functionalities.
 * @class
 */
class ApiService {
    /**
     * Creates an instance of ApiService.
     * @param {Electron.IpcRenderer} ipcRenderer The ipcRenderer instance from Electron.
     */

    // Window Service
    /**
     * Sends an IPC message to the main process to minimize the window.
     * @memberof ApiService
     */
    minimizeWindow() {
        this.ipcRenderer.send('window-minimize');
    }

    /**
     * Sends an IPC message to the main process to maximize or restore the window.
     * @memberof ApiService
     */
    maximizeRestoreWindow() {
        this.ipcRenderer.send('window-maximize-restore');
    }

    /**
     * Sends an IPC message to the main process to close the window.
     * @memberof ApiService
     */
    closeWindow() {
        this.ipcRenderer.send('window-close');
    }

    // Myrient Data Service
    /**
     * Invokes an IPC call to the main process to get the Myrient base URL.
     * @memberof ApiService
     * @returns {Promise<string>} A promise that resolves with the Myrient base URL.
     */
    getMyrientBaseUrl() {
        return this.ipcRenderer.invoke('get-myrient-base-url');
    }

    /**
     * Invokes an IPC call to the main process to get the main archives.
     * @memberof ApiService
     * @returns {Promise<Array<object>>} A promise that resolves with an array of main archive objects.
     */
    getMainArchives() {
        return this.ipcRenderer.invoke('get-main-archives');
    }

    /**
     * Invokes an IPC call to the main process to get the directory list for a given archive.
     * @memberof ApiService
     * @param {object} archive The archive object.
     * @returns {Promise<object>} A promise that resolves with the directory list.
     */
    getDirectoryList(archive) {
        return this.ipcRenderer.invoke('get-directory-list', archive);
    }
    
    /**
     * Invokes an IPC call to the main process to scrape and parse files from a directory.
     * @memberof ApiService
     * @param {object} directory The directory object.
     * @param {object} archive The archive object.
     * @returns {Promise<object>} A promise that resolves with the scraped and parsed file data.
     */
    scrapeAndParseFiles(directory, archive) {
        return this.ipcRenderer.invoke('scrape-and-parse-files', directory, archive);
    }

    // App Service
    /**
     * Invokes an IPC call to the main process to get the application version.
     * @memberof ApiService
     * @returns {Promise<string>} A promise that resolves with the application version.
     */
    getAppVersion() {
        return this.ipcRenderer.invoke('get-app-version');
    }

    /**
     * Invokes an IPC call to the main process to check for updates.
     * @memberof ApiService
     * @returns {Promise<object>} A promise that resolves with update information.
     */
    checkForUpdates() {
        return this.ipcRenderer.invoke('check-for-updates');
    }

    // Shell Service
    /**
     * Sends an IPC message to the main process to open an external URL.
     * @memberof ApiService
     * @param {string} url The URL to open externally.
     */
    openExternal(url) {
        this.ipcRenderer.send('open-external', url);
    }

    /**
     * Invokes an IPC call to the main process to open a dialog.
     * @memberof ApiService
     * @param {object} options Options for the dialog.
     * @returns {Promise<object>} A promise that resolves with the dialog's result.
     */
    openDialog(options) {
        return this.ipcRenderer.invoke('open-dialog', options);
    }

    // File Service
    /**
     * Invokes an IPC call to the main process to get directory and file counts.
     * @memberof ApiService
     * @param {string} path The path to the directory.
     * @returns {Promise<object>} A promise that resolves with an object containing directory and file counts.
     */
    getDirectoryAndFileCounts(path) {
        return this.ipcRenderer.invoke('get-directory-and-file-counts', path);
    }

    // Filter Service
    /**
     * Invokes an IPC call to the main process to filter files.
     * @memberof ApiService
     * @param {object} filters The filter criteria.
     * @returns {Promise<object>} A promise that resolves with the filtered files.
     */
    filterFiles(filters) {
        return this.ipcRenderer.invoke('filter-files', filters);
    }
    
    /**
     * Invokes an IPC call to the main process to get a list of filters.
     * @memberof ApiService
     * @param {number} page The page number for pagination.
     * @param {string} search The search query.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of filter objects.
     */
    async getFilters(page, search) {
        return this.ipcRenderer.invoke('get-filters', page, search);
    }

    /**
     * Invokes an IPC call to the main process to get a specific filter by ID.
     * @memberof ApiService
     * @param {string} id The ID of the filter to retrieve.
     * @returns {Promise<object>} A promise that resolves with the filter object.
     */
    async getFilter(id) {
        return this.ipcRenderer.invoke('get-filter', id);
    }

    /**
     * Invokes an IPC call to the main process to save a filter.
     * @memberof ApiService
     * @param {object} filter The filter object to save.
     * @returns {Promise<object>} A promise that resolves with the saved filter object.
     */
    async saveFilter(filter) {
        return this.ipcRenderer.invoke('save-filter', filter);
    }

    /**
     * Invokes an IPC call to the main process to delete a filter by ID.
     * @memberof ApiService
     * @param {string} id The ID of the filter to delete.
     * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
     */
    async deleteFilter(id) {
        return this.ipcRenderer.invoke('delete-filter', id);
    }

    // Download Service
    /**
     * Invokes an IPC call to the main process to get a list of downloads.
     * @memberof ApiService
     * @param {number} page The page number for pagination.
     * @param {string} search The search query.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of download objects.
     */
    getDownloads(page, search) {
        return this.ipcRenderer.invoke('get-downloads', page, search);
    }

    /**
     * Invokes an IPC call to the main process to save a download.
     * @memberof ApiService
     * @param {object} download The download object to save.
     * @returns {Promise<object>} A promise that resolves with the saved download object.
     */
    saveDownload(download) {
        return this.ipcRenderer.invoke('save-download', download);
    }

    /**
     * Invokes an IPC call to the main process to delete a download by ID.
     * @memberof ApiService
     * @param {string} id The ID of the download to delete.
     * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
     */
    deleteDownload(id) {
        return this.ipcRenderer.invoke('delete-download', id);
    }

    /**
     * Invokes an IPC call to the main process to start a download.
     * @memberof ApiService
     * @param {string} id The ID of the download to start.
     * @returns {Promise<object>} A promise that resolves with the result of the start operation.
     */
    startDownload(id) {
        return this.ipcRenderer.invoke('start-download', id);
    }

    /**
     * Invokes an IPC call to the main process to stop a download.
     * @memberof ApiService
     * @param {string} id The ID of the download to stop.
     * @returns {Promise<object>} A promise that resolves with the result of the stop operation.
     */
    stopDownload(id) {
        return this.ipcRenderer.invoke('stop-download', id);
    }

    /**
     * Invokes an IPC call to the main process to open the download folder.
     * @memberof ApiService
     * @param {string} id The ID of the download whose folder is to be opened.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    openDownloadFolder(id) {
        return this.ipcRenderer.invoke('open-download-folder', id);
    }
}

export default ApiService;
