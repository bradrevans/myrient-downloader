import stateService from '../StateService.js';

/**
 * Service for filtering files.
 * @class
 */
class FilterService {
  /**
   * Runs the file filtering process with the given filters.
   * Updates the state service with the `finalFileList`.
   * @memberof FilterService
   * @param {object} filters The filter criteria to apply.
   * @returns {Promise<void>}
   * @throws {Error} If there is an error during filtering.
   */
  async runFilter(filters) {
    const result = await window.electronAPI.filterFiles(filters);
    if (result.error) {
      throw new Error(result.error);
    }
    stateService.set('finalFileList', result.data);
  }
}

const filterService = new FilterService();
export default filterService;
