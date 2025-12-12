import FilterService from '../services/FilterService.js';

/**
 * Manages filtering operations, acting as an intermediary between the IPC layer and the FilterService.
 * This class handles applying various filters to a list of files, including error handling.
 * @class
 */
class FilterManager {
    /**
     * Creates an instance of FilterManager.
     * @param {FilterService} [filterService] An optional instance of FilterService.
     * @param {MyrientDataManager} myrientDataManager An instance of MyrientDataManager.
     */
    constructor(filterService, myrientDataManager) {
        this.filterService = filterService || new FilterService();
        this.myrientDataManager = myrientDataManager;
    }

    /**
     * Applies a set of filters to the internally stored list of files.
     * @memberof FilterManager
     * @param {object} filters An object containing the filter criteria.
     * @returns {object} An object containing either the filtered data or an error message.
     */
    filterFiles(filters) {
        try {
            const allFiles = this.myrientDataManager.getAllFiles();
            return { data: this.filterService.applyFilters(allFiles, filters) };
        } catch (e) {
            return { error: e.message };
        }
    }
}

export default FilterManager;
