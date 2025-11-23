
/**
 * Formats a number of bytes into a human-readable string (e.g., "1.2 GB", "500 MB").
 * @param {number} bytes The number of bytes to format.
 * @param {number} decimals The number of decimal places to include.
 * @returns {string} The human-readable string.
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a given number of seconds into a human-readable time string (e.g., "1h 2m 3s").
 * @param {number} seconds The number of seconds to format.
 * @returns {string} The human-readable time string.
 */
export function formatTime(seconds) {
  if (seconds < 0) seconds = 0;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (h > 0) {
    parts.push(`${h}h`);
  }
  if (m > 0) {
    parts.push(`${m}m`);
  }
  if (s > 0 || parts.length === 0) {
    parts.push(`${s}s`);
  }

  return parts.join(' ');
}
