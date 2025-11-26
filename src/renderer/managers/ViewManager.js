import stateService from '../StateService.js';

/**
 * Manages the display and switching of different views within the application.
 * @class
 */
class ViewManager {
  /**
   * Creates an instance of ViewManager.
   * @param {HTMLElement} viewContainer The DOM element where views will be loaded.
   */
  constructor(viewContainer) {
    this.viewContainer = viewContainer;
    /**
     * Stores the HTML content of loaded views, keyed by view ID.
     * @type {object<string, string>}
     */
    this.views = {};
    /**
     * The ID of the currently active view.
     * @type {string|null}
     */
    this.currentView = null;
  }

  /**
   * Loads HTML content for all defined views from their respective files.
   * @memberof ViewManager
   * @returns {Promise<void>} A promise that resolves when all views are loaded.
   */
  async loadViews() {
    const viewFiles = ['archives', 'directories', 'wizard', 'results'];
    for (const view of viewFiles) {
      const response = await fetch(`./views/${view}.html`);
      this.views[view] = await response.text();
    }
  }

  /**
   * Displays a specified view and initializes its components.
   * @memberof ViewManager
   * @param {string} viewId The ID of the view to show.
   * @param {object} breadcrumbManager The BreadcrumbManager instance.
   * @param {object} eventManager The EventManager instance.
   * @param {object} searchManager The SearchManager instance.
   */
  showView(viewId, breadcrumbManager, uiManager, searchManager) {
    document.querySelector('main').scrollTop = 0;
    if (this.views[viewId]) {
      if (this.currentView) {
        const prevViewElement = this.viewContainer.querySelector('.view.active');
        if (prevViewElement) {
          prevViewElement.classList.remove('active');
        }
      }

      this.viewContainer.innerHTML = this.views[viewId];
      this.currentView = viewId;
      stateService.set('currentView', viewId);

      const newViewElement = this.viewContainer.querySelector('.view');
      if (newViewElement) {
        newViewElement.classList.add('active');
      }

      const backButton = document.getElementById('header-back-btn');
      if (backButton) {
        if (viewId === 'archives') {
          backButton.classList.add('invisible');
        } else {
          backButton.classList.remove('invisible');
        }
      }

      breadcrumbManager.updateBreadcrumbs();
      uiManager.addEventListeners(viewId);
      searchManager.setupSearchEventListeners(viewId);
    }
  }
}

export default ViewManager;
