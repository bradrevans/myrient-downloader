import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import FilterPersistenceService from '../services/FilterPersistenceService.js';
import { migrateFilterPreset, needsMigration } from '../utils/filterMigration.js';

/**
 * Manages the persistence of filter presets, handling operations like saving, deleting, importing, and exporting.
 * @class
 */
class FilterPersistenceManager {
  /**
   * Initializes the FilterPersistenceManager.
   * Sets up the path to the filters data file and ensures its existence.
   * @constructor
   */
  constructor() {
    const userDataPath = app.getPath('userData');
    const filtersFilePath = path.join(userDataPath, 'filters.json');
    this.filterPersistenceService = new FilterPersistenceService(filtersFilePath);
    this._ensureDataFileExists(filtersFilePath);
  }

  /**
   * Ensures that the filter data file exists. If it doesn't, an empty file is created.
   * It also performs migration of old filter presets to the new format.
   * @param {string} filePath - The path to the filter data file.
   * @private
   */
  async _ensureDataFileExists(filePath) {
    let filters = [];
    try {
      await fs.access(filePath);
      const data = await fs.readFile(filePath, 'utf-8');
      filters = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, '[]', 'utf-8');
        return;
      }
      console.error("Error reading filters file, assuming empty for safety:", error);
    }

    let migrationOccurred = false;
    const migratedFilters = filters.map(filter => {
      if (needsMigration(filter)) {
        migrationOccurred = true;
        return migrateFilterPreset(filter);
      }
      return filter;
    });

    if (migrationOccurred) {
      console.log('Migrating old filter presets to new format...');
      await fs.writeFile(filePath, JSON.stringify(migratedFilters, null, 2), 'utf-8');
      console.log('Filter presets migrated successfully.');
    }
  }

  /**
   * Retrieves all saved filters.
   * @returns {Promise<Array<object>>} A promise that resolves with an array of filter objects.
   */
  async getFilters() {
    return this.filterPersistenceService.getFilters();
  }

  /**
   * Saves a new filter preset.
   * @param {object} filter - The filter object to save.
   * @returns {Promise<object>} A promise that resolves with the result of the save operation.
   */
  async saveFilter(filter) {
    return this.filterPersistenceService.saveFilter(filter);
  }

  /**
   * Deletes a specific filter preset.
   * @param {object} filterToDelete - The filter object to delete.
   * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
   */
  async deleteFilter(filterToDelete) {
    return this.filterPersistenceService.deleteFilter(filterToDelete);
  }

  /**
   * Deletes multiple filter presets.
   * @param {Array<object>} filtersToDelete - An array of filter objects to delete.
   * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
   */
  async deleteFilters(filtersToDelete) {
    return this.filterPersistenceService.deleteFilters(filtersToDelete);
  }

  /**
   * Opens a dialog to import filter presets from a JSON file.
   * @returns {Promise<{filters: Array<object>, status: string, message?: string}>} A promise that resolves with the imported filters and operation status.
   */
  async importFilters() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Filters',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (canceled || filePaths.length === 0) {
      return { filters: await this.getFilters(), status: 'cancelled' };
    }

    const sourcePath = filePaths[0];
    try {
      const updatedFilters = await this.filterPersistenceService.importFilters(sourcePath);
      return { filters: updatedFilters, status: 'success' };
    } catch (e) {
      console.error("Failed to import filters:", e);
      return { filters: await this.getFilters(), status: 'error', message: `Error importing filters: ${e.message}` };
    }
  }

  /**
   * Opens a dialog to export all filter presets to a JSON file.
   * @returns {Promise<{success: boolean, message: string}>} A promise that resolves with the export operation's success status and a message.
   */
  async exportFilters() {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Filters',
      defaultPath: 'myrient-downloader-filters.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Export cancelled.' };
    }

    try {
      await this.filterPersistenceService.exportFilters(filePath);
      return { success: true, message: 'Filters exported successfully.' };
    } catch (error) {
      console.error('Error exporting filters:', error);
      return { success: false, message: 'Failed to export filters.' };
    }
  }

  /**
   * Opens a dialog to export selected filter presets to a JSON file.
   * @param {Array<object>} selectedFilters - An array of filter objects to export.
   * @returns {Promise<{success: boolean, message: string}>} A promise that resolves with the export operation's success status and a message.
   */
  async exportSelectedFilters(selectedFilters) {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Selected Filters',
      defaultPath: 'myrient-downloader-filters.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Export cancelled.' };
    }

    try {
      await this.filterPersistenceService.exportFilters(filePath, selectedFilters);
      return { success: true, message: 'Selected filters exported successfully.' };
    } catch (error) {
      console.error('Error exporting selected filters:', error);
      return { success: false, message: 'Failed to export selected filters.' };
    }
  }
}

export default FilterPersistenceManager;
