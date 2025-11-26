import FilterService from '../services/FilterService.js';

/**
 * Manages filtering operations, acting as an intermediary between the IPC layer and the FilterService.
 * This class handles applying various filters to a list of files, including error handling.
 * @class
 */
class FilterManager {
    /**
     * Creates an instance of FilterManager.
     * @param {FilterService} [filterService] An optional instance of FilterService. If not provided, a new one will be created.
     */
    constructor(filterService) {
        this.filterService = filterService || new FilterService();
    }

    /**
     * Applies a set of filters to a given list of files.
     * @memberof FilterManager
     * @param {Array<object>} allFiles An array of file objects to be filtered.
     * @param {Array<string>} allTags An array of all available tags.
     * @param {object} filters An object containing the filter criteria.
     * @returns {object} An object containing either the filtered data (data) or an error message if the operation fails.
     */
    filterFiles(allFiles, filters) {
        try {
            return { data: this.filterService.applyFilters(allFiles, filters) };
        } catch (e) {
            return { error: e.message };
        }
    }
}

export default FilterManager;
