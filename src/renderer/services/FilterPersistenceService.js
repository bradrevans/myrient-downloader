class FilterPersistenceService {
  async getFilters() {
    return window.electronAPI.getFilters();
  }

  async saveFilter(filter) {
    return window.electronAPI.saveFilter(filter);
  }

  async deleteFilter(filterName) {
    return window.electronAPI.deleteFilter(filterName);
  }

  async importFilters() {
    return window.electronAPI.importFilters();
  }

  async exportFilters() {
    return window.electronAPI.exportFilters();
  }
}

export default new FilterPersistenceService();
