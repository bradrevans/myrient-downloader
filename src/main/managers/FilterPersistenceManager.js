import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import FilterPersistenceService from '../services/FilterPersistenceService.js';

class FilterPersistenceManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    const filtersFilePath = path.join(userDataPath, 'filters.json');
    this.filterPersistenceService = new FilterPersistenceService(filtersFilePath);
    this._ensureDataFileExists(filtersFilePath);
  }

  async _ensureDataFileExists(filePath) {
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, '[]', 'utf-8');
      }
    }
  }

  async getFilters() {
    return this.filterPersistenceService.getFilters();
  }

  async saveFilter(filter) {
    return this.filterPersistenceService.saveFilter(filter);
  }

  async deleteFilter(filterName) {
    return this.filterPersistenceService.deleteFilter(filterName);
  }

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
    } catch(e) {
        console.error("Failed to import filters:", e);
        return { filters: await this.getFilters(), status: 'error', message: e.message };
    }
  }

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
}

export default FilterPersistenceManager;
