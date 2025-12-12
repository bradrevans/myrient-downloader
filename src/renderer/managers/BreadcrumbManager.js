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
        const directoryStack = stateService.get('directoryStack') || [];
        const currentView = stateService.get('currentView');
        const downloadFromHere = stateService.get('downloadFromHere');

        const isRootView = directoryStack.length === 0;
        const rootClickableClasses = isRootView ? '' : 'cursor-pointer hover:text-orange-500';
        let html = `<span title="Myrient Downloader" class="truncate ${rootClickableClasses} transition-all duration-200" data-step="0">Myrient Downloader</span>`;

        directoryStack.forEach((item, index) => {
            const isLast = index === directoryStack.length - 1;
            let clickableClasses = '';

            if (!isLast) {
                clickableClasses = 'cursor-pointer hover:text-orange-500';
            } else {
                const onWizardOrResults = currentView === 'wizard' || currentView === 'results';
                if (onWizardOrResults && downloadFromHere) {
                    clickableClasses = 'cursor-pointer hover:text-orange-500';
                }
            }

            html += `${separator}<span title="${item.name}" class="truncate transition-all duration-200 ${clickableClasses}" data-step="${index + 1}">${item.name}</span>`;
        });
        this.breadcrumbs.innerHTML = html;
    }
}

export default BreadcrumbManager;
