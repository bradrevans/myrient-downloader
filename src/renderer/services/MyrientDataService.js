import stateService from '../StateService.js';

/**
 * Service for fetching data from Myrient.
 * @class
 */
class MyrientDataService {
  /**
   * Loads the main archives from the Myrient service.
   * @memberof MyrientDataService
   * @returns {Promise<Array<{name: string, href: string, isDir: boolean}>>} A promise that resolves with an array of archive objects.
   * @throws {Error} If there is an error fetching the archives.
   */
  async loadArchives() {
    const result = await window.electronAPI.getMainArchives();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  }

  /**
   * Loads the directory list for the currently selected archive.
   * @memberof MyrientDataService
   * @returns {Promise<Array<{name: string, href: string, isDir: boolean}>>} A promise that resolves with an array of directory objects.
   * @throws {Error} If there is an error fetching the directory list.
   */
  async loadDirectories() {
    const archiveUrl = new URL(stateService.get('archive').href, stateService.get('baseUrl')).href;
    const result = await window.electronAPI.getDirectoryList(archiveUrl);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  }

  /**
   * Scrapes and parses files from the currently selected directory.
   * Updates the state service with the `allFiles` and `allTags`.
   * @memberof MyrientDataService
   * @returns {Promise<{files: Array<object>, tags: object, hasSubdirectories: boolean}>} A promise that resolves with an object containing
   *   `files` (an array of file objects), `tags` (an object of tags), and a boolean indicating if there were subdirectories.
   * @throws {Error} If there is an error scraping or parsing files.
   */
  async scrapeAndParseFiles() {
    const archiveHref = stateService.get('archive').href;
    const directoryHref = stateService.get('directory').href;
    const path = archiveHref === directoryHref ? archiveHref : archiveHref + directoryHref;
    const pageUrl = new URL(path, stateService.get('baseUrl')).href;
    const result = await window.electronAPI.scrapeAndParseFiles(pageUrl);
    if (result.error) {
      throw new Error(result.error);
    }
    stateService.set('allFiles', result.files);
    stateService.set('allTags', result.tags);
    return { files: result.files, tags: result.tags, hasSubdirectories: result.hasSubdirectories };
  }
}

const myrientDataService = new MyrientDataService();
export default myrientDataService;
