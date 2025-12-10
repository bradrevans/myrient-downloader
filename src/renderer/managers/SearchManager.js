import Search from '../ui/Search.js';
import KeyboardNavigator from '../ui/KeyboardNavigator.js';

/**
 * Manages search instances and their event listeners for various views.
 * @class
 * @typedef {object} SearchConfig
 * @property {string} searchId The ID of the search input element.
 * @property {string} [listId] The ID of the list container element for single-list searches.
 * @property {string} [includeListId] The ID of the include list container for wizard-like dual-list searches.
 * @property {string} [excludeListId] The ID of the exclude list container for wizard-like dual-list searches.
 * @property {string} itemSelector A CSS selector for the searchable items within the list.
 * @property {string} noResultsText The message to display when no search results are found.
 * @property {string} noItemsText The message to display when no items are available.
 * @property {string} [parentContainerId] The ID of the parent container for keyboard navigation in wizard views.
 */
class SearchManager {
  /**
   * Creates an instance of SearchManager.
   * @param {UIManager} uiManager The UIManager instance for general UI interactions.
   */
  constructor(uiManager) {
    this.uiManager = uiManager;
    /**
     * Stores instances of the Search class, keyed by their listId.
     * @type {object<string, Search>}
     */
    this.searchInstances = {};
  }

  /**
   * Sets up search event listeners and initializes Search instances for a given view.
   * @memberof SearchManager
   * @param {string} viewId The ID of the current view (e.g., 'archives', 'directories', 'wizard', 'results').
   */
  setupSearchEventListeners(viewId) {
    this.searchInstances = {};
    /**
     * Configuration for search instances across different views.
     * @typedef {object} SearchConfig
     * @property {string} searchId The ID of the search input element.
     * @property {string} [listId] The ID of the list container element for single-list searches.
     * @property {string} [includeListId] The ID of the include list container for wizard-like dual-list searches.
     * @property {string} [excludeListId] The ID of the exclude list container for wizard-like dual-list searches.
     * @property {string} itemSelector A CSS selector for the searchable items within the list.
     * @property {string} noResultsText The message to display when no search results are found.
     * @property {string} noItemsText The message to display when no items are available.
     * @property {string} [parentContainerId] The ID of the parent container for keyboard navigation in wizard views.
     */
    const searchConfigs = {
      'directories': {
        searchId: 'search-directories',
        listIds: ['list-directories', 'list-files'], // Array of list IDs
        itemSelector: '.list-item, .file-item', // Matches both directory and file items
        noResultsText: 'No directories or files found matching your search.',
        noItemsText: 'No directories or files available.'
      },
      'wizard': [
        {
          searchId: 'search-tags-region',
          includeListId: 'wizard-tags-list-region-include',
          excludeListId: 'wizard-tags-list-region-exclude',
          itemSelector: 'label',
          noResultsText: 'No region tags found matching your search.',
          noItemsText: 'No region tags available.',
          parentContainerId: 'tag-category-region-container'
        },
        {
          searchId: 'search-tags-language',
          includeListId: 'wizard-tags-list-language-include',
          excludeListId: 'wizard-tags-list-language-exclude',
          itemSelector: 'label',
          noResultsText: 'No language tags found matching your search.',
          noItemsText: 'No language tags available.',
          parentContainerId: 'tag-category-language-container'
        },
        {
          searchId: 'search-tags-other',
          includeListId: 'wizard-tags-list-other-include',
          excludeListId: 'wizard-tags-list-other-exclude',
          itemSelector: 'label',
          noResultsText: 'No other tags found matching your search.',
          noItemsText: 'No other tags available.',
          parentContainerId: 'tag-category-other-container'
        },
        {
          searchId: 'search-priority-tags',
          listId: 'priority-available',
          itemSelector: '.list-group-item',
          noResultsText: 'No tags found matching your search.',
          noItemsText: 'No tags have been selected.',
          parentContainerId: 'priority-available-container'
        }
      ],
      'results': {
        searchId: 'search-results',
        listId: 'results-list',
        itemSelector: 'label',
        noResultsText: 'No results found matching your search.',
        noItemsText: 'No results match your filters.'
      }
    };

    const configs = searchConfigs[viewId];
    if (!configs) return;

    let firstSearchInputFocused = false;

    if (viewId === 'wizard') {
      const processedSearchIds = new Set();
      configs.forEach(config => {
        if (processedSearchIds.has(config.searchId)) return;
        processedSearchIds.add(config.searchId);

        const searchInput = document.getElementById(config.searchId);
        if (!searchInput) return;

        if (config.includeListId) {
          const includeListEl = document.getElementById(config.includeListId);
          if (includeListEl) {
            this.searchInstances[config.includeListId] = new Search(config.searchId, [config.includeListId], config.itemSelector, config.noResultsText, config.noItemsText, `${config.searchId}-clear`);
          }
        }
        if (config.excludeListId) {
          const excludeListEl = document.getElementById(config.excludeListId);
          if (excludeListEl) {
            this.searchInstances[config.excludeListId] = new Search(config.searchId, [config.excludeListId], config.itemSelector, config.noResultsText, config.noItemsText, `${config.searchId}-clear`);
          }
        }
        if (config.listId && !config.includeListId) {
          const listEl = document.getElementById(config.listId);
          if (listEl) {
            this.searchInstances[config.listId] = new Search(config.searchId, [config.listId], config.itemSelector, config.noResultsText, config.noItemsText, `${config.searchId}-clear`);
          }
        }

        const parentContainer = document.getElementById(config.parentContainerId);
        if (parentContainer && searchInput) {
          const listContainers = [];
          if (config.includeListId) listContainers.push(document.getElementById(config.includeListId));
          if (config.excludeListId) listContainers.push(document.getElementById(config.excludeListId));
          if (config.listId && !config.includeListId) listContainers.push(document.getElementById(config.listId));

          const filteredListContainers = listContainers.filter(el => el !== null);

          const listToInputMap = {};
          if (config.includeListId) listToInputMap[config.includeListId] = config.searchId;
          if (config.excludeListId) listToInputMap[config.excludeListId] = config.searchId;
          if (config.listId) listToInputMap[config.listId] = config.searchId;

          const keyboardNavigator = new KeyboardNavigator(filteredListContainers, config.itemSelector, [searchInput], this.uiManager, [], listToInputMap);
          parentContainer.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator));
          searchInput.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator));

          if (!firstSearchInputFocused) {
            searchInput.focus();
            firstSearchInputFocused = true;
          }
        }
      });
    } else {
      (Array.isArray(configs) ? configs : [configs]).forEach(config => {
        const instanceKey = config.listIds ? config.searchId : config.listId; // Key by searchId for multi-list, listId for single
        const listContainerIdsToPass = config.listIds || [config.listId]; // Pass array of IDs
        const headerContainerIdToPass = (viewId === 'directories' && config.listIds) ? 'files-header-container' : null;
        
        this.searchInstances[instanceKey] = new Search(config.searchId, listContainerIdsToPass, config.itemSelector, config.noResultsText, config.noItemsText, `${config.searchId}-clear`, headerContainerIdToPass);

        const listContainersForKeyboard = listContainerIdsToPass.map(id => document.getElementById(id)).filter(el => el !== null);
        const searchInput = document.getElementById(config.searchId);
        if (listContainersForKeyboard.length > 0 && searchInput) {
          const keyboardNavigator = new KeyboardNavigator(listContainersForKeyboard, config.itemSelector, [searchInput], this.uiManager);
          listContainersForKeyboard.forEach(container => container.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator)));
          searchInput.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator));
          if (!firstSearchInputFocused) {
            searchInput.focus();
            firstSearchInputFocused = true;
          }
        }
      });
    }
  }

  /**
   * Refreshes the search placeholders for all managed search instances.
   * This typically re-applies the current search filter to update the displayed items.
   * @memberof SearchManager
   */
  refreshSearchPlaceholders() {
    for (const key in this.searchInstances) {
      if (Object.hasOwnProperty.call(this.searchInstances, key)) {
        this.searchInstances[key].handleSearch();
      }
    }
  }
}

export default SearchManager;

