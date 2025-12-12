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
    const searchConfigs = {
      'directories': {
        searchId: 'search-directories',
        listIds: ['list-directories', 'list-files'],
        itemSelector: '.list-item, .file-item',
        noResultsText: 'No directories or files found matching your search.',
        noItemsText: 'No directories or files available.'
      },
      'wizard': [
        {
          searchId: 'search-tags-region',
          itemSelector: 'label',
          noResultsText: 'No region tags found matching your search.',
          noItemsText: 'No region tags available.',
          parentContainerId: 'tag-category-region-container',
          options: {
            customSearchHandler: (query) => {
              const wizardManager = this.uiManager.wizardManager;
              if (wizardManager && wizardManager.virtualLists) {
                wizardManager.virtualLists['region-include']?.search(query);
                wizardManager.virtualLists['region-exclude']?.search(query);
              }
            }
          }
        },
        {
          searchId: 'search-tags-language',
          itemSelector: 'label',
          noResultsText: 'No language tags found matching your search.',
          noItemsText: 'No language tags available.',
          parentContainerId: 'tag-category-language-container',
          options: {
            customSearchHandler: (query) => {
              const wizardManager = this.uiManager.wizardManager;
              if (wizardManager && wizardManager.virtualLists) {
                wizardManager.virtualLists['language-include']?.search(query);
                wizardManager.virtualLists['language-exclude']?.search(query);
              }
            }
          }
        },
        {
          searchId: 'search-tags-other',
          itemSelector: 'label',
          noResultsText: 'No other tags found matching your search.',
          noItemsText: 'No other tags available.',
          parentContainerId: 'tag-category-other-container',
          options: {
            customSearchHandler: (query) => {
              const wizardManager = this.uiManager.wizardManager;
              if (wizardManager && wizardManager.virtualLists) {
                wizardManager.virtualLists['other-include']?.search(query);
                wizardManager.virtualLists['other-exclude']?.search(query);
              }
            }
          }
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
        noItemsText: 'No results match your filters.',
        options: {
          customSearchHandler: (query) => {
            if (this.uiManager.downloadUI && this.uiManager.downloadUI.virtualList) {
              this.uiManager.downloadUI.virtualList.search(query);
            }
          }
        }
      }
    };

    const configs = searchConfigs[viewId];
    if (!configs) return;

    let firstSearchInputFocused = false;

    if (viewId === 'wizard') {
      configs.forEach(config => {
        const listIds = config.listId ? [config.listId] : [];
        this.searchInstances[config.searchId] = new Search(
          config.searchId,
          listIds,
          config.itemSelector,
          config.noResultsText,
          config.noItemsText,
          `${config.searchId}-clear`,
          null,
          config.options
        );

        const searchInput = document.getElementById(config.searchId);
        const parentContainer = document.getElementById(config.parentContainerId);

        if (parentContainer && searchInput) {
          const listContainers = [];
          if (config.listId) {
            listContainers.push(document.getElementById(config.listId));
          } else if (config.options && config.options.customSearchHandler) {
            const category = config.searchId.split('-')[2]; // e.g., 'region' from 'search-tags-region'
            listContainers.push(document.getElementById(`wizard-tags-list-${category}-include`));
            listContainers.push(document.getElementById(`wizard-tags-list-${category}-exclude`));
          }

          const filteredListContainers = listContainers.filter(el => el);
          if (filteredListContainers.length > 0) {
            const listToInputMap = {};
            filteredListContainers.forEach(c => { listToInputMap[c.id] = config.searchId; });

            const keyboardNavigator = new KeyboardNavigator(filteredListContainers, config.itemSelector, [searchInput], this.uiManager, [], listToInputMap);
            parentContainer.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator));
            searchInput.addEventListener('keydown', keyboardNavigator.handleKeyDown.bind(keyboardNavigator));
          }

          if (!firstSearchInputFocused) {
            searchInput.focus();
            firstSearchInputFocused = true;
          }
        }
      });
    } else {
      (Array.isArray(configs) ? configs : [configs]).forEach(config => {
        const instanceKey = config.listIds ? config.searchId : config.listId;
        const listContainerIdsToPass = config.listIds || [config.listId];
        const headerContainerIdToPass = (viewId === 'directories' && config.listIds) ? 'files-header-container' : null;

        this.searchInstances[instanceKey] = new Search(config.searchId, listContainerIdsToPass, config.itemSelector, config.noResultsText, config.noItemsText, `${config.searchId}-clear`, headerContainerIdToPass, config.options);

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

