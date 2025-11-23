/**
 * Service for window-related actions.
 * @class
 */
class WindowService {
  /**
   * Minimizes the application window.
   * @memberof WindowService
   */
  minimizeWindow() {
    window.electronAPI.windowMinimize();
  }

  /**
   * Maximizes or restores the application window.
   * @memberof WindowService
   */
  maximizeRestoreWindow() {
    window.electronAPI.windowMaximizeRestore();
  }

  /**
   * Closes the application window.
   * @memberof WindowService
   */
  closeWindow() {
    window.electronAPI.windowClose();
  }

  /**
   * Resets the zoom factor of the web contents to default.
   * @memberof WindowService
   */
  zoomReset() {
    window.electronAPI.zoomReset();
  }

  /**
   * Retrieves the current zoom factor of the web contents.
   * @memberof WindowService
   * @returns {Promise<number>} A promise that resolves with the current zoom factor.
   */
  async getZoomFactor() {
    return await window.electronAPI.getZoomFactor();
  }

  /**
   * Sets the zoom factor of the web contents.
   * @memberof WindowService
   * @param {number} factor The zoom factor to set.
   */
  setZoomFactor(factor) {
    window.electronAPI.setZoomFactor(factor);
  }
}

const windowService = new WindowService();
export default windowService;
