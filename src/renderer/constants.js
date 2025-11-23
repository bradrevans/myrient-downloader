/**
 * Defines constants for IPC event names used in the renderer process.
 * @type {object}
 * @property {string} DOWNLOAD_LOG - Event for logging download messages.
 * @property {string} DOWNLOAD_OVERALL_PROGRESS - Event for overall download progress updates.
 * @property {string} DOWNLOAD_COMPLETE - Event indicating download completion.
 * @property {string} DOWNLOAD_SCAN_PROGRESS - Event for download scan progress updates.
 * @property {string} DOWNLOAD_FILE_PROGRESS - Event for individual file download progress updates.
 */
export const EVENTS = {
  DOWNLOAD_LOG: 'download-log',
  DOWNLOAD_OVERALL_PROGRESS: 'download-overall-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  DOWNLOAD_SCAN_PROGRESS: 'download-scan-progress',
  DOWNLOAD_FILE_PROGRESS: 'download-file-progress',
};

/**
 * Defines constants for keyboard key names used in event handling.
 * @type {object}
 * @property {string} ENTER - The 'Enter' key.
 * @property {string} ARROW_UP - The 'ArrowUp' key.
 * @property {string} ARROW_DOWN - The 'ArrowDown' key.
 * @property {string} ARROW_LEFT - The 'ArrowLeft' key.
 * @property {string} ARROW_RIGHT - The 'ArrowRight' key.
 */
export const KEYS = {
  ENTER: 'Enter',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
};
