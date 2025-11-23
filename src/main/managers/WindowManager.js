/**
 * Manages operations related to an Electron BrowserWindow instance,
 * including window state (minimize, maximize, close) and zoom levels.
 * @class
 */
class WindowManager {
    /**
     * Creates an instance of WindowManager.
     * @param {Electron.BrowserWindow} win The Electron BrowserWindow instance to manage.
     */
    constructor(win) {
        this.win = win;
    }

    /**
     * Minimizes the managed window.
     * @memberof WindowManager
     */
    minimize() {
        this.win.minimize();
    }

    /**
     * Maximizes or restores the managed window based on its current state.
     * @memberof WindowManager
     */
    maximizeRestore() {
        if (this.win.isMaximized()) {
            this.win.unmaximize();
        } else {
            this.win.maximize();
        }
    }

    /**
     * Closes the managed window.
     * @memberof WindowManager
     */
    close() {
        this.win.close();
    }

    /**
     * Increases the zoom factor of the window's web contents by 0.1.
     * @memberof WindowManager
     */
    zoomIn() {
        const currentZoom = this.win.webContents.getZoomFactor();
        this.win.webContents.setZoomFactor(currentZoom + 0.1);
    }

    /**
     * Decreases the zoom factor of the window's web contents by 0.1.
     * @memberof WindowManager
     */
    zoomOut() {
        const currentZoom = this.win.webContents.getZoomFactor();
        this.win.webContents.setZoomFactor(currentZoom - 0.1);
    }

    /**
     * Resets the zoom factor of the window's web contents to 1 (100%).
     * @memberof WindowManager
     */
    zoomReset() {
        this.win.webContents.setZoomFactor(1);
    }

    /**
     * Gets the current zoom factor of the window's web contents.
     * @memberof WindowManager
     * @returns {number} The current zoom factor.
     */
    getZoomFactor() {
        return this.win.webContents.getZoomFactor();
    }

    /**
     * Sets the zoom factor of the window's web contents.
     * @memberof WindowManager
     * @param {number} factor The zoom factor to set. (e.g., 1 for 100%, 1.1 for 110%).
     */
    setZoomFactor(factor) {
        this.win.webContents.setZoomFactor(factor);
    }
}

export default WindowManager;
