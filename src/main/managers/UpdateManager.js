import axios from 'axios';
import { compareVersions } from '../../shared/utils/versions.js';

/**
 * Manages checking for application updates by interacting with the GitHub API.
 * Compares the current application version with the latest available release.
 * @class
 */
class UpdateManager {
    /**
     * Creates an instance of UpdateManager.
     * @param {string} appVersion The current version of the application.
     */
    constructor(appVersion) {
        this.appVersion = appVersion;
    }

    /**
     * Checks for a new application update by querying the GitHub API for the latest release.
     * @memberof UpdateManager
     * @returns {Promise<{isUpdateAvailable: boolean, latestVersion: string, releaseNotes: string, releaseUrl: string}|{error: string}>}
     * A promise that resolves with update information or an error message if the check fails.
     */
    async checkForUpdates() {
        try {
            const response = await axios.get('https://api.github.com/repos/bradrevans/myrient-downloader/releases/latest');
            const latestVersion = response.data.tag_name.replace('v', '');
            const isUpdateAvailable = compareVersions(latestVersion, this.appVersion) > 0;
            return {
                isUpdateAvailable,
                latestVersion,
                releaseNotes: response.data.body,
                releaseUrl: response.data.html_url,
            };
        } catch (error) {
            return { error: 'Could not check for updates.' };
        }
    }

    /**
     * Returns the current version of the application.
     * @memberof UpdateManager
     * @returns {string} The application version.
     */
    getAppVersion() {
        return this.appVersion;
    }
}

export default UpdateManager;
