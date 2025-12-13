import fs from 'fs/promises';
import path from 'path';
import { migrateFilterPreset, needsMigration } from '../utils/filterMigration.js';

/**
 * Handles the reading and writing of filter presets to a JSON file.
 * @class
 */
class FilterPersistenceService {
  /**
   * Initializes the FilterPersistenceService.
   * @constructor
   * @param {string} filtersFilePath - The path to the filters JSON file.
   */
  constructor(filtersFilePath) {
    this.filtersFilePath = filtersFilePath;
  }

  /**
   * Reads filters from the JSON file.
   * @private
   * @returns {Promise<Array<object>>} A promise that resolves with an array of filter objects. Returns an empty array if the file doesn't exist.
   */
  async _readFilters() {
    try {
      await fs.access(this.filtersFilePath);
      const data = await fs.readFile(this.filtersFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist, return empty array
      }
      throw error;
    }
  }

  /**
   * Writes an array of filters to the JSON file.
   * @private
   * @param {Array<object>} filters - The array of filter objects to write.
   * @returns {Promise<void>}
   */
  async _writeFilters(filters) {
    await fs.writeFile(this.filtersFilePath, JSON.stringify(filters, null, 2), 'utf-8');
  }

  /**
   * Retrieves all saved filters.
   * @returns {Promise<Array<object>>} A promise that resolves with an array of filter objects.
   */
  async getFilters() {
    return this._readFilters();
  }

  /**
   * Saves or updates a filter preset. If a filter with the same name, archive, and directory exists, it's updated; otherwise, it's added.
   * @param {object} newFilter - The new filter object to save.
   * @returns {Promise<Array<object>>} A promise that resolves with the updated list of filters.
   */
  async saveFilter(newFilter) {
    const filters = await this._readFilters();
    // Apply migration if newFilter is in the old format (e.g., from an external source or older part of the app)
    const filterToSave = needsMigration(newFilter) ? migrateFilterPreset(newFilter) : newFilter;

    const existingIndex = filters.findIndex(f => f.name === filterToSave.name && f.fullPath === filterToSave.fullPath);
    if (existingIndex > -1) {
      filters[existingIndex] = filterToSave; // Update existing filter
    } else {
      filters.push(filterToSave);
    }
    await this._writeFilters(filters);
    return filters;
  }

  /**
   * Deletes a single filter preset.
   * @param {object} filterToDelete - The filter object to delete.
   * @returns {Promise<Array<object>>} A promise that resolves with the updated list of filters.
   */
  async deleteFilter(filterToDelete) {
    let filters = await this._readFilters();
    // Use fullPath for identification as archiveHref/directoryHref are deprecated in new format
    filters = filters.filter(f => f.name !== filterToDelete.name || f.fullPath !== filterToDelete.fullPath);
    await this._writeFilters(filters);
    return filters;
  }

  /**
   * Deletes multiple filter presets.
   * @param {Array<object>} filtersToDelete - An array of filter objects to delete.
   * @returns {Promise<Array<object>>} A promise that resolves with the updated list of filters.
   */
  async deleteFilters(filtersToDelete) {
    let filters = await this._readFilters();
    filters = filters.filter(f => !filtersToDelete.some(fd => f.name === fd.name && f.fullPath === fd.fullPath));
    await this._writeFilters(filters);
    return filters;
  }

  /**
   * Imports filter presets from a specified JSON file, merging them with existing filters.
   * @param {string} sourcePath - The path to the JSON file to import.
   * @returns {Promise<Array<object>>} A promise that resolves with the merged list of filters.
   * @throws {Error} Throws an error if the file format is invalid.
   */
  async importFilters(sourcePath) {
    try {
      const data = await fs.readFile(sourcePath, 'utf-8');
      let importedFilters;
      try {
        importedFilters = JSON.parse(data);
      } catch (e) {
        throw new Error('Invalid JSON format.');
      }

      // Basic validation of imported filters
      if (!Array.isArray(importedFilters) || !importedFilters.every(f => f && typeof f === 'object' && f.name && f.filterSettings)) {
        throw new Error('Invalid filter format.');
      }

      // Migrate imported filters if necessary
      const migratedImportedFilters = importedFilters.map(filter => {
        if (needsMigration(filter)) {
          console.log(`Migrating imported filter "${filter.name}" to new format.`);
          return migrateFilterPreset(filter);
        }
        return filter;
      });

      let currentFilters = await this._readFilters();

      migratedImportedFilters.forEach(importedFilter => {
        if (importedFilter && importedFilter.name) {
          // Use fullPath for identification as archiveHref/directoryHref are deprecated in new format
          const existingIndex = currentFilters.findIndex(f => f.name === importedFilter.name && f.fullPath === importedFilter.fullPath);
          if (existingIndex > -1) {
            currentFilters[existingIndex] = importedFilter;
          } else {
            currentFilters.push(importedFilter);
          }
        }
      });

      await this._writeFilters(currentFilters);
      return currentFilters;
    } catch (error) {
      console.error('Error importing filters:', error);
      if (error.message.startsWith('Invalid')) {
        throw error;
      }
      throw new Error('Failed to import filters.');
    }
  }

  /**
   * Exports filter presets to a specified JSON file.
   * @param {string} destinationPath - The path where the JSON file will be saved.
   * @param {Array<object>} [filtersToExport] - Optional. An array of specific filters to export. If not provided, all filters are exported.
   * @returns {Promise<void>}
   */
  async exportFilters(destinationPath, filtersToExport) {
    const filters = filtersToExport || await this._readFilters();
    await fs.writeFile(destinationPath, JSON.stringify(filters, null, 2), 'utf-8');
  }
}

export default FilterPersistenceService;
