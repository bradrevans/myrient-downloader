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
    const isDefaultFilter = filters.include_tags.length === 0 &&
      filters.exclude_tags.length === 0 &&
      filters.rev_mode === 'all' &&
      filters.dedupe_mode === 'all' &&
      filters.priority_list.length === 0;

    if (isDefaultFilter) {
      stateService.set('finalFileList', stateService.get('allFiles'));
    } else {
      const result = await window.electronAPI.filterFiles(stateService.get('allFiles'), filters);
      if (result.error) {
        throw new Error(result.error);
      }
      stateService.set('finalFileList', result.data);
    }
  }
}

const filterService = new FilterService();
export default filterService;
