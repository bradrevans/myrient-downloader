import { dialog } from 'electron';
import { DOWNLOAD_DIRECTORY_STRUCTURE } from '../../shared/constants/appConstants.js';
import FileSystemService from '../services/FileSystemService.js';

/**
 * Manages download-related operations, including selecting download directories,
 * checking directory structure, canceling downloads, and initiating downloads.
 * It acts as an intermediary between the IPC layer and the FileSystemService and DownloadManager.
 * @class
 */
class DownloadOperationManager {
  /**
   * Creates an instance of DownloadOperationManager.
   * @param {object} win The Electron BrowserWindow instance.
   * @param {object} downloadManager An instance of the DownloadManager.
   */
  constructor(win, downloadManager) {
    this.win = win;
    this.downloadManager = downloadManager;
  }

  /**
   * Opens a dialog for the user to select a download directory.
   * @memberof DownloadOperationManager
   * @returns {Promise<string|null>} A promise that resolves with the selected directory path, or null if the dialog is canceled.
   */
  async getDownloadDirectory() {
    const { canceled, filePaths } = await dialog.showOpenDialog(this.win, {
      title: 'Select Download Directory',
      properties: ['openDirectory', 'createDirectory']
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  }

  /**
   * Checks the structure of the given download directory.
   * @memberof DownloadOperationManager
   * @param {string} downloadPath The path to the download directory.
   * @returns {Promise<{data: object}|{error: string}>} A promise that resolves with an object containing either
   * the directory structure data or an error message if the operation fails.
   */
  async checkDownloadDirectoryStructure(downloadPath) {
    try {
      const structure = await FileSystemService.checkDownloadDirectoryStructure(downloadPath);
      return { data: structure };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Returns the enumeration of possible download directory structures.
   * @memberof DownloadOperationManager
   * @returns {{data: object}} An object containing the DOWNLOAD_DIRECTORY_STRUCTURE enum.
   */
  getDownloadDirectoryStructureEnum() {
    return { data: DOWNLOAD_DIRECTORY_STRUCTURE };
  }

  /**
   * Cancels the ongoing download operation.
   * @memberof DownloadOperationManager
   */
  cancelDownload() {
    this.downloadManager.cancel();
  }

  /**
   * Initiates a download operation.
   * @memberof DownloadOperationManager
   * @param {string} baseUrl The base URL for the downloads.
   * @param {Array<object>} files An array of file objects to download.
   * @param {string} targetDir The target directory for the downloads.
   * @param {boolean} createSubfolder Whether to create a subfolder within the target directory.
   * @param {boolean} maintainFolderStructure Whether to maintain the original folder structure of the files.
   * @param {boolean} extractAndDelete Whether to extract archives and delete the original files.
   * @param {boolean} extractPreviouslyDownloaded Whether to extract previously downloaded archives.
   * @param {boolean} isThrottlingEnabled Whether download throttling is enabled.
   * @param {number} throttleSpeed The speed for download throttling.
   * @param {string} throttleUnit The unit for download throttling speed (e.g., 'kb', 'mb').
   * @returns {Promise<object>} A promise that resolves with an object containing the download status or an error object.
   */
  async startDownload(baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, isThrottlingEnabled, throttleSpeed, throttleUnit) {
    try {
      return await this.downloadManager.startDownload(baseUrl, files, targetDir, createSubfolder, maintainFolderStructure, extractAndDelete, extractPreviouslyDownloaded, isThrottlingEnabled, throttleSpeed, throttleUnit);
    } catch (e) {
      return { error: e && e.message ? e.message : String(e) };
    }
  }
}

export default DownloadOperationManager;
