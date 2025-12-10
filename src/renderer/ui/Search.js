/**
 * Manages search functionality and filtering of displayed items in a list.
 * @class
 * @property {HTMLElement} searchInput The input element used for searching.
 * @property {Array<HTMLElement>} listContainers An array of container elements holding the items to be filtered.
 * @property {string} itemSelector A CSS selector to identify individual items within the listContainers.
 * @property {string} noResultsText The text to display when no search results are found.
 * @property {string} noItemsText The text to display when there are no items in the list.
 * @property {HTMLElement} clearBtn The button to clear the search input.
 * @property {HTMLElement|null} headerContainer An optional container element that holds related headers (like separators or titles) to be toggled with search results.
 */
export default class Search {
  /**
   * Creates an instance of Search.
   * @param {string} inputId The ID of the input element used for searching.
   * @param {Array<string>} listContainerIds An array of IDs of the container elements holding the items to be filtered.
   * @param {string} itemSelector A CSS selector to identify individual items within the listContainers.
   * @param {string} noResultsText The text to display when no search results are found.
   * @param {string} noItemsText The text to display when there are no items in the list.
   * @param {string} clearId The ID of the button to clear the search input.
   * @param {string} [headerContainerId] Optional: The ID of a header container whose visibility should be toggled based on search results.
   */
  constructor(inputId, listContainerIds, itemSelector, noResultsText, noItemsText, clearId, headerContainerId = null) {
    this.searchInput = document.getElementById(inputId);
    this.listContainers = listContainerIds.map(id => document.getElementById(id)).filter(el => el !== null);
    this.itemSelector = itemSelector;
    this.noResultsText = noResultsText;
    this.noItemsText = noItemsText;
    this.clearBtn = document.getElementById(clearId);
    this.headerContainer = headerContainerId ? document.getElementById(headerContainerId) : null;

    this.boundHandleSearch = this.handleSearch.bind(this);
    this.boundClearButtonToggle = () => {
      if (this.searchInput && this.clearBtn) {
        this.clearBtn.classList.toggle('hidden', this.searchInput.value.length === 0);
      }
    };
    this.boundClearButtonClick = () => {
      if (this.searchInput && this.clearBtn) {
        this.searchInput.value = '';
        this.clearBtn.classList.add('hidden');
        this.searchInput.dispatchEvent(new Event('input'));
        this.searchInput.focus();
      }
    };

    if (this.searchInput && this.listContainers.length > 0) {
      this.searchInput.addEventListener('input', this.boundHandleSearch);
      this.handleSearch(); // Initial search on load
    }

    if (this.searchInput && this.clearBtn) {
      this.clearBtn.classList.toggle('hidden', this.searchInput.value.length === 0);
      this.clearBtn.addEventListener('click', this.boundClearButtonClick);
    }
  }
  /**
   * Cleans up event listeners to prevent memory leaks.
   * @memberof Search
   */
  destroy() {
    if (this.searchInput && this.boundHandleSearch) {
      this.searchInput.removeEventListener('input', this.boundHandleSearch);
    }
    if (this.searchInput && this.clearBtn && this.boundClearButtonToggle && this.boundClearButtonClick) {
      this.searchInput.removeEventListener('input', this.boundClearButtonToggle);
      this.clearBtn.removeEventListener('click', this.boundClearButtonClick);
    }
    // Remove any no-results elements from all containers
    this.listContainers.forEach(container => {
      const noResultsEl = container.querySelector('.no-results');
      if (noResultsEl) {
        noResultsEl.remove();
      }
    });
  }

  /**
   * Handles the search input event, filtering the list items based on the query.
   * Shows/hides items and displays messages for no results or no items.
   * @memberof Search
   */
  handleSearch() {
    const query = this.searchInput.value.toLowerCase();
    const searchTerms = query.split(' ').filter(term => term.length > 0);
    let totalVisibleCount = 0;
    let totalItemsCount = 0;
    let visibleFilesCount = 0;

    this.listContainers.forEach(container => {
      const allItems = container.querySelectorAll(this.itemSelector);
      totalItemsCount += allItems.length;

      allItems.forEach(item => {
        const name = (item.dataset.name || item.textContent).toLowerCase();
        const isMatch = searchTerms.every(term => name.includes(term));
        item.classList.toggle('hidden', !isMatch);
        if (isMatch) {
          totalVisibleCount++;
          // Check if this is a file item from the 'list-files' container
          if (container.id === 'list-files') {
            visibleFilesCount++;
          }
        }
      });

      // Remove previous no-results message from this container
      const oldNoResultsEl = container.querySelector('.no-results');
      if (oldNoResultsEl) {
        oldNoResultsEl.remove();
      }
    });


    let message = '';
    if (totalItemsCount === 0) {
      message = this.noItemsText;
    } else if (totalVisibleCount === 0 && query.length > 0) {
      message = this.noResultsText;
    }

    // Display message in the first container
    if (message && this.listContainers.length > 0) {
      const noResultsEl = document.createElement('div');
      noResultsEl.className = 'no-results col-span-full text-center text-neutral-500';
      noResultsEl.textContent = message;
      this.listContainers[0].appendChild(noResultsEl);
    }

    // Toggle headerContainer visibility based on visibleFilesCount
    if (this.headerContainer && this.headerContainer.id === 'files-header-container') {
      if (visibleFilesCount === 0 && query.length > 0) { // Only hide if no files match and there's an active query
        this.headerContainer.classList.add('hidden');
      } else {
        this.headerContainer.classList.remove('hidden');
      }
    }
  }
}
