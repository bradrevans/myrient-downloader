import stateService from '../StateService.js';

/**
 * Service for fetching data from Myrient.
 * @class
 */
class MyrientDataService {
  /**
   * Loads the directory list for the given URL. If no URL is provided, loads the root directories.
   * @memberof MyrientDataService
   * @param {string} [url] The URL to load the directory from.
   * @returns {Promise<{directories: Array<{name: string, href: string, isDir: boolean}>, files: Array<{name: string, href: string, isDir: boolean, size: string}>}>} A promise that resolves with an object containing `directories` and `files` arrays.
   * @throws {Error} If there is an error fetching the directory list.
   */
  async loadDirectory(url) {
    const result = await window.electronAPI.getDirectory(url);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  }

  /**
   * Scrapes and parses files from the currently selected directory path.
   * Updates the state service with the `allFiles` and `allTags`.
   * @memberof MyrientDataService
   * @returns {Promise<{files: Array<object>, tags: object, hasSubdirectories: boolean}>} A promise that resolves with an object containing
   *   `files` (an array of file objects), `tags` (an object of tags), and a boolean indicating if there were subdirectories.
   * @throws {Error} If there is an error scraping or parsing files.
   */
  async scrapeAndParseFiles() {
    const directoryStack = stateService.get('directoryStack');
    const path = directoryStack.map(item => item.href).join('');
    const pageUrl = new URL(path, stateService.get('baseUrl')).href;
    const result = await window.electronAPI.scrapeAndParseFiles(pageUrl);
    if (result.error) {
      throw new Error(result.error);
    }
    stateService.set('allTags', result.tags);
  }
}

const myrientDataService = new MyrientDataService();
export default myrientDataService;
