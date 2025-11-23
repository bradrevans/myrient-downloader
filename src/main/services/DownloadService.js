import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import { Throttle } from '@kldzj/stream-throttle';
import FileSystemService from './FileSystemService.js';

/**
 * Service responsible for handling the actual downloading of files,
 * including managing progress updates, cancellation, resuming downloads,
 * throttling, and error handling during the download process.
 * @class
 * @property {boolean} downloadCancelled - Flag to indicate if the current download operation has been cancelled.
 * @property {https.Agent} httpAgent - An HTTP agent configured for keep-alive connections.
 * @property {AbortController} abortController - An AbortController instance for signal-based cancellation of requests.
 * @property {ConsoleService} downloadConsole - An instance of ConsoleService for logging download-related messages.
 */
class DownloadService {
  /**
   * Creates an instance of DownloadService.
   * @param {ConsoleService} downloadConsole An instance of ConsoleService for logging.
   */
  constructor(downloadConsole) {
    this.downloadCancelled = false;
    this.httpAgent = new https.Agent({ keepAlive: true });
    this.abortController = new AbortController();
    this.downloadConsole = downloadConsole;
  }

  /**
   * Cancels any ongoing download operations by setting the cancellation flag and aborting the current AbortController signal.
   * @memberof DownloadService
   */
  cancel() {
    this.downloadCancelled = true;
    this.abortController.abort();
  }

  /**
   * Checks if the current download operation has been cancelled.
   * @memberof DownloadService
   * @returns {boolean} True if the download has been cancelled, false otherwise.
   */
  isCancelled() {
    return this.downloadCancelled;
  }

  /**
   * Resets the download service's state, allowing for new download operations.
   * This involves resetting the cancellation flag and creating a new AbortController instance.
   * @memberof DownloadService
   */
  reset() {
    this.downloadCancelled = false;
    this.abortController = new AbortController();
  }

  /**
   * Downloads a list of files sequentially, providing progress updates.
   * This method handles file creation, partial downloads (resuming), throttling, and error recovery for individual files.
   *
   * @memberof DownloadService
   * @param {Electron.BrowserWindow} win The Electron BrowserWindow instance, used to send progress updates to the renderer process.
   * @param {string} baseUrl The base URL from which the files are to be downloaded.
   * @param {Array<object>} files An array of file objects to download. Each object should contain:
   *   - `name` (string): The filename.
   *   - `href` (string): The full URL of the file.
   *   - `size` (number): The total size of the file in bytes.
   *   - `downloadedBytes` (number, optional): The number of bytes already downloaded for this specific file, for resuming.
   *   - `skip` (boolean, optional): If true, this file will be skipped.
   * @param {string} targetDir The absolute path to the directory where the files will be saved.
   * @param {number} totalSize The total expected size of all files combined (in bytes), used for overall progress calculation.
   * @param {number} [initialDownloadedSize=0] The cumulative size of files that were already downloaded or skipped before starting this batch (in bytes).
   * @param {boolean} [createSubfolder=false] If true, each file will be downloaded into a subfolder named after the file's base name within `targetDir`.
   * @param {boolean} [maintainFolderStructure=false] If true, the remote folder structure indicated by `file.href` and `baseUrl` will be recreated within `targetDir`.
   * @param {number} totalFilesOverall The total number of files originally selected for download, including those skipped or already processed.
   * @param {number} initialSkippedFileCount The number of files that were skipped from the beginning due to various reasons (e.g., already exists).
   * @param {boolean} [isThrottlingEnabled=false] If true, limits the download speed to `throttleSpeed`.
   * @param {number} [throttleSpeed=10] The speed limit for throttling in the given `throttleUnit`.
   * @param {'KB/s'|'MB/s'} [throttleUnit='MB/s'] The unit for `throttleSpeed`.
   * @returns {Promise<{skippedFiles: Array<string>, downloadedFiles: Array<object>}>} A promise that resolves with an object containing:
   *   - `skippedFiles` (Array<string>): An array of filenames that could not be downloaded due to errors.
   *   - `downloadedFiles` (Array<{name: string, href: string, size: number, path: string}>): An array of file objects that were successfully downloaded, including their final saved path.
   * @throws {Error} If the download is explicitly cancelled by the user, either between files ("CANCELLED_BETWEEN_FILES") or during a file transfer ("CANCELLED_MID_FILE").
   *   Other errors during the download of a specific file will be caught and added to `skippedFiles`.
   */
  async downloadFiles(win, baseUrl, files, targetDir, totalSize, initialDownloadedSize = 0, createSubfolder = false, maintainFolderStructure = false, totalFilesOverall, initialSkippedFileCount, isThrottlingEnabled = false, throttleSpeed = 10, throttleUnit = 'MB/s') {
    const session = axios.create({
      httpsAgent: this.httpAgent,
      timeout: 15000,
      headers: {
        'User-Agent': 'Wget/1.21.3 (linux-gnu)'
      }
    });

    let totalDownloaded = initialDownloadedSize;
    let totalBytesFailed = 0;
    const skippedFiles = [];
    const downloadedFiles = [];
    let lastDownloadProgressUpdateTime = 0;

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const fileInfo = files[fileIndex];
      if (this.isCancelled()) {
        throw new Error("CANCELLED_BETWEEN_FILES");
      }

      if (fileInfo.skip) continue;

      const filename = fileInfo.name;
      const { targetPath } = FileSystemService.calculatePaths(targetDir, fileInfo, { createSubfolder, maintainFolderStructure, baseUrl });

      const finalDir = path.dirname(targetPath);
      if (!fs.existsSync(finalDir)) {
        try {
          fs.mkdirSync(finalDir, { recursive: true });
        } catch (mkdirErr) {
          this.downloadConsole.logCreatingSubfolderError(finalDir, mkdirErr.message);
        }
      }

      const fileUrl = fileInfo.href;
      const fileSize = fileInfo.size || 0;
      let fileDownloaded = fileInfo.downloadedBytes || 0;

      const headers = {
        'User-Agent': 'Wget/1.21.3 (linux-gnu)'
      };

      if (fileDownloaded > 0) {
        headers['Range'] = `bytes=${fileDownloaded}-`;
        this.downloadConsole.logResumingDownload(filename, fileDownloaded);
      }

      try {
        const response = await session.get(fileUrl, {
          responseType: 'stream',
          timeout: 30000,
          signal: this.abortController.signal,
          headers: headers
        });

        const writer = fs.createWriteStream(targetPath, {
          highWaterMark: 1024 * 1024,
          flags: fileDownloaded > 0 ? 'a' : 'w'
        });

        win.webContents.send('download-file-progress', {
          name: filename,
          current: fileDownloaded,
          total: fileSize,
          currentFileIndex: initialSkippedFileCount + fileIndex + 1,
          totalFilesToDownload: totalFilesOverall
        });

        let stream = response.data;
        if (isThrottlingEnabled) {
          let bytesPerSecond = throttleSpeed * 1024;
          if (throttleUnit === 'MB/s') {
            bytesPerSecond = throttleSpeed * 1024 * 1024;
          }
          const throttle = new Throttle({ rate: bytesPerSecond });
          stream = response.data.pipe(throttle);
        }

        await new Promise((resolve, reject) => {
          const cleanupAndReject = (errMessage) => {
            writer.close(() => {
              if (fs.existsSync(targetPath)) {
                this.downloadConsole.log(`Cleaning up partial file: ${filename}`);
                fs.unlink(targetPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error(`Failed to delete partial file: ${targetPath}`, unlinkErr);
                  }
                  const err = new Error(errMessage);
                  err.partialFile = { path: targetPath, name: filename };
                  reject(err);
                });
              } else {
                const err = new Error(errMessage);
                err.partialFile = { path: targetPath, name: filename };
                reject(err);
              }
            });
          };

          stream.on('data', (chunk) => {
            if (this.isCancelled()) {
              response.request.abort();
              cleanupAndReject("CANCELLED_MID_FILE");
              return;
            }
            fileDownloaded += chunk.length;
            totalDownloaded += chunk.length;
            writer.write(chunk);

            const now = performance.now();
            if (now - lastDownloadProgressUpdateTime > 100 || fileDownloaded === fileSize) {
              lastDownloadProgressUpdateTime = now;
              win.webContents.send('download-file-progress', {
                name: filename,
                current: fileDownloaded,
                total: fileSize,
                currentFileIndex: initialSkippedFileCount + fileIndex + 1,
                totalFilesToDownload: totalFilesOverall
              });
              win.webContents.send('download-overall-progress', {
                current: totalDownloaded,
                total: totalSize - totalBytesFailed,
                skippedSize: initialDownloadedSize
              });
            }
          });

          stream.on('end', () => {
            writer.end();
          });

          writer.on('finish', () => {
            downloadedFiles.push({ ...fileInfo, path: targetPath });
            resolve();
          });
          writer.on('error', (err) => {
            reject(err);
          });
          stream.on('error', (err) => {
            if (this.isCancelled()) {
              cleanupAndReject("CANCELLED_MID_FILE");
            } else {
              reject(err);
            }
          });
        });

      } catch (e) {
        if (e.name === 'AbortError' || e.message.startsWith("CANCELLED_")) {
          throw e;
        }

        this.downloadConsole.logError(`Failed to download ${filename}. ${e.message}`);
        skippedFiles.push(filename);

        totalDownloaded -= fileDownloaded;
        totalBytesFailed += fileSize;

        win.webContents.send('download-overall-progress', {
          current: totalDownloaded,
          total: totalSize - totalBytesFailed,
          skippedSize: initialDownloadedSize
        });

        try {
          if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        } catch (fsErr) {
        }
      }
    }

    return { skippedFiles, downloadedFiles };
  }
}

export default DownloadService;
