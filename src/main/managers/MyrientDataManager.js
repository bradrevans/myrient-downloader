import { MYRIENT_BASE_URL } from '../../shared/constants/appConstants.js';
import MyrientService from '../services/MyrientService.js';

/**
 * Manages data operations related to Myrient, acting as an intermediary between the IPC layer and the MyrientService.
 * This class handles fetching archives, directory listings, and scraping file data, including error handling.
 * @class
 */
class MyrientDataManager {
    /**
     * Creates an instance of MyrientDataManager.
     * @param {MyrientService} myrientService An instance of MyrientService for interacting with Myrient data.
     */
    constructor(myrientService) {
        this.myrientService = myrientService;
    }

    /**
     * Asynchronously retrieves the main archives from Myrient.
     * @memberof MyrientDataManager
     * @returns {Promise<{data: Array<object>}|{error: string}>} A promise that resolves with an object containing either
     * an array of main archives (data) or an error message if the operation fails.
     */
    async getMainArchives() {
        try {
            const data = await this.myrientService.getMainArchives(MYRIENT_BASE_URL);
            return { data };
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * Asynchronously retrieves a list of directories for a given archive URL from Myrient.
     * @memberof MyrientDataManager
     * @param {string} archiveUrl The URL of the archive to retrieve the directory list from.
     * @returns {Promise<{data: Array<object>}|{error: string}>} A promise that resolves with an object containing either
     * an array of directory items (data) or an error message if the operation fails.
     */
    async getDirectoryList(archiveUrl) {
        try {
            const response = await this.myrientService.getDirectoryList(archiveUrl);
            return response;
        } catch (e) {
            return { error: e.message };
        }
    }

    /**
     * Asynchronously scrapes and parses file data from a given Myrient page URL.
     * @memberof MyrientDataManager
     * @param {string} pageUrl The URL of the page to scrape and parse files from.
     * @returns {Promise<{data: object}|{error: string}>} A promise that resolves with an object containing either
     * the scraped and parsed file data (data) or an error message if the operation fails.
     */
    async scrapeAndParseFiles(pageUrl) {
        try {
            const response = await this.myrientService.scrapeAndParseFiles(pageUrl);
            return response;
        } catch (e) {
            return { error: e.message };
        }
    }
}

export default MyrientDataManager;
