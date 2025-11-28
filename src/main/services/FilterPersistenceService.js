import fs from 'fs/promises';
import path from 'path';

class FilterPersistenceService {
  constructor(filtersFilePath) {
    this.filtersFilePath = filtersFilePath;
  }

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

  async _writeFilters(filters) {
    await fs.writeFile(this.filtersFilePath, JSON.stringify(filters, null, 2), 'utf-8');
  }

  async getFilters() {
    return this._readFilters();
  }

  async saveFilter(newFilter) {
    const filters = await this._readFilters();
    const existingIndex = filters.findIndex(f => f.name === newFilter.name);
    if (existingIndex > -1) {
      filters[existingIndex] = newFilter; // Update existing filter
    } else {
      filters.push(newFilter);
    }
    await this._writeFilters(filters);
    return filters;
  }

  async deleteFilter(filterName) {
    let filters = await this._readFilters();
    filters = filters.filter(f => f.name !== filterName);
    await this._writeFilters(filters);
    return filters;
  }

  async importFilters(sourcePath) {
    try {
      const data = await fs.readFile(sourcePath, 'utf-8');
      const importedFilters = JSON.parse(data);
      
      // Basic validation of imported filters
      if (!Array.isArray(importedFilters)) {
        throw new Error('Imported file is not a valid filter array.');
      }
      
      let currentFilters = await this._readFilters();
      
      importedFilters.forEach(importedFilter => {
        if (importedFilter && importedFilter.name) {
          const existingIndex = currentFilters.findIndex(f => f.name === importedFilter.name);
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
      throw new Error('Failed to import filters.');
    }
  }

  async exportFilters(destinationPath) {
    const filters = await this._readFilters();
    await fs.writeFile(destinationPath, JSON.stringify(filters, null, 2), 'utf-8');
  }
}

export default FilterPersistenceService;
