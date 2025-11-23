import stateService from '../StateService.js';

/**
 * Manages the display and interaction of breadcrumbs in the user interface.
 * @class
 * @property {HTMLElement} breadcrumbs The HTML element representing the breadcrumbs container.
 */
class BreadcrumbManager {
    /**
     * Creates an instance of BreadcrumbManager.
     * Initializes the breadcrumbs element.
     */
    constructor() {
        this.breadcrumbs = document.getElementById('breadcrumbs');
    }

    /**
     * Updates the breadcrumbs in the UI based on the current application state.
     * It reflects the selected archive and directory.
     * @memberof BreadcrumbManager
     */
    updateBreadcrumbs() {
        const separator = `
            <span class="mx-2 pointer-events-none">
                <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </span>
        `;
        let html = `<span title="Myrient Downloader" class="truncate cursor-pointer hover:text-orange-500 transition-all duration-200" data-view="archives" data-step="0">Myrient Downloader</span>`;
        if (stateService.get('archive').name) {
            html += `${separator}<span title="${stateService.get('archive').name}" class="truncate cursor-pointer hover:text-orange-500 transition-all duration-200" data-view="directories" data-step="1">${stateService.get('archive').name}</span>`;
        }
        if (stateService.get('directory').name) {
            html += `${separator}<span title="${stateService.get('directory').name}" class="truncate hover:text-orange-500 transition-all duration-200">${stateService.get('directory').name}</span>`;
        }
        this.breadcrumbs.innerHTML = html;
    }
}

export default BreadcrumbManager;
