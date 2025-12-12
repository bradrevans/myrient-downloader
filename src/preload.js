const { contextBridge, ipcRenderer } = require('electron');

/**
 * @file Exposes a safe, bidirectional bridge between the isolated renderer process and the main process.
 * This script uses Electron's contextBridge to selectively expose IPC functions to the renderer,
 * enhancing security by preventing the renderer from directly accessing Node.js or Electron APIs.
 *
 * @namespace electronAPI
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Gets the application version.
   * @returns {Promise<string>} The application's version string.
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  /**
   * Checks for application updates.
   * @returns {Promise<object>} A promise that resolves with update information.
   */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  /**
   * Fetches the directory listing for a given URL, or the root directories if no URL is provided.
   * @param {string} [url] - The URL to fetch the directory from.
   * @returns {Promise<object>} A promise resolving to the directory list.
   */
  getDirectory: (url) => ipcRenderer.invoke('get-directory', url),
  /**
   * Scrapes and parses files from a given page URL.
   * @param {string} pageUrl - The URL to scrape.
   * @returns {Promise<object>} A promise resolving to the parsed file data.
   */
  scrapeAndParseFiles: (pageUrl) => ipcRenderer.invoke('scrape-and-parse-files', pageUrl),
  /**
   * Filters a list of files based on specified criteria.
   * @param {Array<object>} files - The files to filter.
   * @param {object} filters - The filter criteria.
   * @returns {Promise<object>} A promise resolving to the filtered file data.
   */
  filterFiles: (files, filters) => ipcRenderer.invoke('filter-files', files, filters),
  /**
   * Opens a dialog to select a download directory.
   * @returns {Promise<string|null>} The selected directory path or null if canceled.
   */
  getDownloadDirectory: () => ipcRenderer.invoke('get-download-directory'),
  /**
   * Checks the structure of the specified download directory.
   * @param {string} downloadPath - The path to check.
   * @returns {Promise<object>} A promise resolving to the directory structure details.
   */
  checkDownloadDirectoryStructure: (downloadPath) => ipcRenderer.invoke('check-download-directory-structure', downloadPath),
  /**
   * Gets the enumeration for download directory structures.
   * @returns {Promise<object>} A promise resolving to the directory structure enum.
   */
  getDownloadDirectoryStructureEnum: () => ipcRenderer.invoke('get-download-directory-structure-enum'),
  /**
   * Starts the download process with the specified settings.
   * @returns {Promise<object>} A promise that resolves when the download begins.
   */
  startDownload: (baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, skipScan, isThrottlingEnabled, throttleSpeed, throttleUnit) => ipcRenderer.invoke('start-download', baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, skipScan, isThrottlingEnabled, throttleSpeed, throttleUnit),
  /**
   * Cancels the ongoing download operation.
   */
  cancelDownload: () => ipcRenderer.send('cancel-download'),
  /**
   * Opens a URL in the default external browser.
   * @param {string} url - The URL to open.
   */
  openExternal: (url) => ipcRenderer.send('open-external', url),
  /**
   * Opens a directory in the default file explorer.
   * @param {string} path - The directory path to open.
   */
  openDirectory: (path) => ipcRenderer.send('open-directory', path),
  /**
   * Minimizes the application window.
   */
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  /**
   * Maximizes or restores the application window.
   */
  windowMaximizeRestore: () => ipcRenderer.send('window-maximize-restore'),
  /**
   * Closes the application window.
   */
  windowClose: () => ipcRenderer.send('window-close'),
  /**
   * Increases the window zoom level.
   */
  zoomIn: () => ipcRenderer.send('zoom-in'),
  /**
   * Decreases the window zoom level.
   */
  zoomOut: () => ipcRenderer.send('zoom-out'),
  /**
   * Resets the window zoom level to default.
   */
  zoomReset: () => ipcRenderer.send('zoom-reset'),
  /**
   * Gets the current window zoom factor.
   * @returns {Promise<number>} The current zoom factor.
   */
  getZoomFactor: () => ipcRenderer.invoke('get-zoom-factor'),
  /**
   * Sets the window zoom factor.
   * @param {number} factor - The new zoom factor.
   */
  setZoomFactor: (factor) => ipcRenderer.send('set-zoom-factor', factor),
  /**
   * Registers a callback for download scan progress updates.
   * @param {function} callback - The function to call with progress data.
   */
  onDownloadScanProgress: (callback) => ipcRenderer.on('download-scan-progress', (event, data) => callback(data)),
  /**
   * Registers a callback for overall download progress updates.
   * @param {function} callback - The function to call with progress data.
   */
  onDownloadOverallProgress: (callback) => ipcRenderer.on('download-overall-progress', (event, data) => callback(data)),
  /**
   * Registers a callback for individual file download progress updates.
   * @param {function} callback - The function to call with progress data.
   */
  onDownloadFileProgress: (callback) => ipcRenderer.on('download-file-progress', (event, data) => callback(data)),
  /**
   * Registers a callback for download log messages.
   * @param {function} callback - The function to call with the log message.
   */
  onDownloadLog: (callback) => ipcRenderer.on('download-log', (event, message) => callback(message)),
  /**
   * Registers a callback for when the download is complete.
   * @param {function} callback - The function to call with the download summary.
   */
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, summary) => callback(summary)),
  /**
   * Registers a callback for when extraction begins.
   * @param {function} callback - The function to call.
   */
  onExtractionStarted: (callback) => ipcRenderer.on('extraction-started', () => callback()),
  /**
   * Registers a callback for when extraction ends.
   * @param {function} callback - The function to call.
   */
  onExtractionEnded: (callback) => ipcRenderer.on('extraction-ended', () => callback()),
  /**
   * Registers a callback for extraction progress updates.
   * @param {function} callback - The function to call with progress data.
   */
  onExtractionProgress: (callback) => ipcRenderer.on('extraction-progress', (event, data) => callback(data)),
  /**
   * Registers a callback to hide the download UI components.
   * @param {function} callback - The function to call.
   */
  onHideDownloadUi: (callback) => ipcRenderer.on('hide-download-ui', (event) => callback()),
  /**
   * Fetches all saved filter presets.
   * @returns {Promise<Array<object>>} A promise that resolves with an array of filter objects.
   */
  getFilters: () => ipcRenderer.invoke('get-filters'),
  /**
   * Saves a filter preset.
   * @param {object} filter - The filter to save.
   * @returns {Promise<object>} A promise that resolves with the result of the save operation.
   */
  saveFilter: (filter) => ipcRenderer.invoke('save-filter', filter),
  /**
   * Deletes a specific filter preset.
   * @param {object} filterToDelete - The filter to delete.
   * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
   */
  deleteFilter: (filterToDelete) => ipcRenderer.invoke('delete-filter', filterToDelete),
  /**
   * Deletes multiple filter presets.
   * @param {Array<object>} filtersToDelete - An array of filters to delete.
   * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
   */
  deleteFilters: (filtersToDelete) => ipcRenderer.invoke('delete-filters', filtersToDelete),
  /**
   * Imports filter presets from a file.
   * @returns {Promise<object>} A promise that resolves with the result of the import operation.
   */
  importFilters: () => ipcRenderer.invoke('import-filters'),
  /**
   * Exports all filter presets to a file.
   * @returns {Promise<object>} A promise that resolves with the result of the export operation.
   */
  exportFilters: () => ipcRenderer.invoke('export-filters'),
  /**
   * Exports selected filter presets to a file.
   * @param {Array<object>} selectedFilters - The filters to export.
   * @returns {Promise<object>} A promise that resolves with the result of the export operation.
   */
  exportSelectedFilters: (selectedFilters) => ipcRenderer.invoke('export-selected-filters', selectedFilters),
});
