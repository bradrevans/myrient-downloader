/**
 * Service for shell-related actions.
 * @class
 */
class ShellService {
  /**
   * Opens a directory in the user's file explorer.
   * @memberof ShellService
   * @param {string} path The path to the directory to open.
   */
  openDirectory(path) {
    window.electronAPI.openDirectory(path);
  }

  /**
   * Opens a URL in the user's default external browser.
   * @memberof ShellService
   * @param {string} url The URL to open.
   */
  openExternal(url) {
    window.electronAPI.openExternal(url);
  }
}

const shellService = new ShellService();
export default shellService;
