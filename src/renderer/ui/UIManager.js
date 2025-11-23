import ViewManager from '../managers/ViewManager.js';
import ModalManager from '../managers/ModalManager.js';
import BreadcrumbManager from '../managers/BreadcrumbManager.js';
import SearchManager from '../managers/SearchManager.js';
import WizardManager from '../managers/WizardManager.js';
import EventManager from '../managers/EventManager.js';
import InfoIcon from './InfoIcon.js';
import tooltipContent from '../tooltipContent.js';

/**
 * Manages the overall user interface of the application, coordinating different UI managers and services.
 * @class
 * @property {HTMLElement} viewContainer The DOM element where different views are rendered.
 * @property {function(): void} loadArchivesCallback Callback function to load archives.
 * @property {ViewManager} viewManager Manages view switching.
 * @property {ModalManager} modalManager Manages confirmation modals.
 * @property {BreadcrumbManager} breadcrumbManager Manages breadcrumb navigation.
 * @property {SearchManager} searchManager Manages search functionality.
 * @property {WizardManager} wizardManager Manages the filtering wizard.
 * @property {EventManager} eventManager Manages UI event listeners.
 * @property {DownloadUI} downloadUI Manages download-related UI components.
 */
class UIManager {
    /**
     * Creates an instance of UIManager.
     * @param {HTMLElement} viewContainer The DOM element where views will be loaded.
     * @param {function(): void} loadArchivesCallback Callback function to load archives.
     */
    constructor(viewContainer, loadArchivesCallback) {
        this.viewContainer = viewContainer;
        this.loadArchivesCallback = loadArchivesCallback;

        this.viewManager = new ViewManager(viewContainer);
        this.modalManager = new ModalManager();
        this.breadcrumbManager = new BreadcrumbManager();
        this.searchManager = new SearchManager(this);
        this.wizardManager = new WizardManager(this);
        this.eventManager = new EventManager(this, loadArchivesCallback);

        this.downloadUI = null;
    }

    /**
     * Sets the instance of DownloadUI for this manager.
     * @memberof UIManager
     * @param {DownloadUI} downloadUI The DownloadUI instance.
     */
    setDownloadUI(downloadUI) {
        this.downloadUI = downloadUI;
    }

    /**
     * Displays a loading spinner and message.
     * @memberof UIManager
     * @param {string} [text='Loading...'] The message to display alongside the spinner.
     */
    showLoading(text = 'Loading...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-spinner').classList.remove('hidden');
    }

    /**
     * Hides the loading spinner.
     * @memberof UIManager
     */
    hideLoading() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    /**
     * Displays a specified view using the ViewManager.
     * @memberof UIManager
     * @param {string} viewId The ID of the view to show.
     */
    showView(viewId) {
        this.viewManager.showView(viewId, this.breadcrumbManager, this.eventManager, this.searchManager);
    }
    
    /**
     * Populates a list element with items and attaches a click handler to each item.
     * @memberof UIManager
     * @param {string} listId The ID of the HTML list element to populate.
     * @param {Array<object>} items An array of objects to display in the list. Each object should have `name` and `href` properties.
     * @param {function(object): void} clickHandler The function to call when an item is clicked, receiving the item object as an argument.
     */
    populateList(listId, items, clickHandler) {
        const listEl = document.getElementById(listId);
        if (!listEl) return;
        listEl.innerHTML = '';
        items.forEach(item => {
            const el = document.createElement('button');
            el.className = 'list-item text-left';
            el.textContent = item.name;
            el.dataset.name = item.name;
            el.dataset.href = item.href;
            el.tabIndex = 0;
            el.addEventListener('click', () => clickHandler(item));
            listEl.appendChild(el);
        });
    }

    /**
     * Displays a confirmation modal using the ModalManager.
     * @memberof UIManager
     * @param {string} message The message to display in the modal.
     * @param {object} [options={}] Optional settings for the modal.
     * @returns {Promise<boolean|null>} A promise that resolves to true if confirmed, false if cancelled, or null if dismissed.
     */
    showConfirmationModal(message, options = {}) {
        return this.modalManager.showConfirmationModal(message, options);
    }

    /**
     * Adds an information icon with a tooltip to a specified element.
     * @memberof UIManager
     * @param {string} targetElementId The ID of the element to which the info icon will be added.
     * @param {string} tooltipKey The key for retrieving the tooltip text from `tooltipContent`.
     * @param {'after'|'append'|'prepend'} [placement='after'] The placement of the icon relative to the target element.
     */
    addInfoIconToElement(targetElementId, tooltipKey, placement = 'after') {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) {
            console.warn(`Target element with ID '${targetElementId}' not found for info icon.`);
            return;
        }
        const text = tooltipContent[tooltipKey];
        if (!text) {
            console.warn(`Tooltip content for key '${tooltipKey}' not found.`);
            return;
        }

        const infoIcon = new InfoIcon(text);

        const isHeading = /^H[1-6]$/i.test(targetElement.tagName);

        if (isHeading) {
            targetElement.classList.add('inline-flex', 'items-center');
            targetElement.appendChild(infoIcon.element);
        } else if (placement === 'after') {
            targetElement.parentNode.insertBefore(infoIcon.element, targetElement.nextSibling);
        } else if (placement === 'append') {
            targetElement.appendChild(infoIcon.element);
        } else if (placement === 'prepend') {
            targetElement.prepend(infoIcon.element);
        }
    }
}

export default UIManager;

