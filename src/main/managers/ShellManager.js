import { shell } from 'electron';

/**
 * Manages interactions with the operating system's shell, providing functionalities
 * to open external URLs and directories.
 * @class
 */
class ShellManager {
    /**
     * Opens the given external URL in the user's default browser.
     * @memberof ShellManager
     * @param {string} url The URL to open.
     */
    openExternal(url) {
        shell.openExternal(url);
    }

    /**
     * Opens the given file or directory path in the operating system's default application.
     * @memberof ShellManager
     * @param {string} path The path to the file or directory to open.
     */
    openDirectory(path) {
        shell.openPath(path);
    }
}

export default ShellManager;
