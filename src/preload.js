const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getMainArchives: () => ipcRenderer.invoke('get-main-archives'),
  getDirectoryList: (archiveUrl) => ipcRenderer.invoke('get-directory-list', archiveUrl),
  scrapeAndParseFiles: (pageUrl) => ipcRenderer.invoke('scrape-and-parse-files', pageUrl),
  filterFiles: (files, filters) => ipcRenderer.invoke('filter-files', files, filters),

  getDownloadDirectory: () => ipcRenderer.invoke('get-download-directory'),
  checkDownloadDirectoryStructure: (downloadPath) => ipcRenderer.invoke('check-download-directory-structure', downloadPath),
  getDownloadDirectoryStructureEnum: () => ipcRenderer.invoke('get-download-directory-structure-enum'),

  startDownload: (baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, isThrottlingEnabled, throttleSpeed, throttleUnit) => ipcRenderer.invoke('start-download', baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, isThrottlingEnabled, throttleSpeed, throttleUnit),
  cancelDownload: () => ipcRenderer.send('cancel-download'),

  openExternal: (url) => ipcRenderer.send('open-external', url),
  openDirectory: (path) => ipcRenderer.send('open-directory', path),

  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximizeRestore: () => ipcRenderer.send('window-maximize-restore'),
  windowClose: () => ipcRenderer.send('window-close'),

  zoomIn: () => ipcRenderer.send('zoom-in'),
  zoomOut: () => ipcRenderer.send('zoom-out'),
  zoomReset: () => ipcRenderer.send('zoom-reset'),

  getZoomFactor: () => ipcRenderer.invoke('get-zoom-factor'),
  setZoomFactor: (factor) => ipcRenderer.send('set-zoom-factor', factor),

  onDownloadScanProgress: (callback) => ipcRenderer.on('download-scan-progress', (event, data) => callback(data)),
  onDownloadOverallProgress: (callback) => ipcRenderer.on('download-overall-progress', (event, data) => callback(data)),
  onDownloadFileProgress: (callback) => ipcRenderer.on('download-file-progress', (event, data) => callback(data)),
  onDownloadLog: (callback) => ipcRenderer.on('download-log', (event, message) => callback(message)),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, summary) => callback(summary)),
  onExtractionStarted: (callback) => ipcRenderer.on('extraction-started', () => callback()),
  onExtractionEnded: (callback) => ipcRenderer.on('extraction-ended', () => callback()),
  onExtractionProgress: (callback) => ipcRenderer.on('extraction-progress', (event, data) => callback(data)),
  onHideDownloadUi: (callback) => ipcRenderer.on('hide-download-ui', (event) => callback()),

});
