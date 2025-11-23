/**
 * Service for application-related actions.
 * @class
 */
class AppService {
  /**
   * Retrieves the application version.
   * @memberof AppService
   * @returns {Promise<string>} A promise that resolves with the application version string.
   */
  async getAppVersion() {
    return await window.electronAPI.getAppVersion();
  }

  /**
   * Checks for application updates.
   * @memberof AppService
   * @returns {Promise<object>} A promise that resolves with the update information.
   */
  async checkForUpdates() {
    return await window.electronAPI.checkForUpdates();
  }
}

const appService = new AppService();
export default appService;
