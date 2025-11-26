import ViewManager from '../managers/ViewManager.js';
import ModalManager from '../managers/ModalManager.js';
import BreadcrumbManager from '../managers/BreadcrumbManager.js';
import SearchManager from '../managers/SearchManager.js';
import WizardManager from '../managers/WizardManager.js';
import InfoIcon from './InfoIcon.js';
import tooltipContent from '../tooltipContent.js';
import stateService from '../StateService.js';
import filterService from '../services/FilterService.js';
import downloadService from '../services/DownloadService.js';
import shellService from '../services/ShellService.js';

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
        this.viewManager.showView(viewId, this.breadcrumbManager, this, this.searchManager);
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

    /**
     * Adds event listeners specific to the given view ID.
     * @memberof UIManager
     * @param {string} viewId The ID of the current view (e.g., 'wizard', 'results').
     */
    addEventListeners(viewId) {
        if (viewId === 'wizard') {
            document.getElementById('wizard-run-btn').addEventListener('click', async () => {
                const includeTags = stateService.get('includeTags');
                const excludeTags = stateService.get('excludeTags');

                const allIncludeTags = Object.values(includeTags).flat();
                const allExcludeTags = Object.values(excludeTags).flat();

                const priorityList = Array.from(document.querySelectorAll('#priority-list .list-group-item')).map(el => el.textContent);

                const filters = {
                    include_tags: allIncludeTags,
                    exclude_tags: allExcludeTags,
                    rev_mode: document.querySelector('#filter-revision-mode .toggle-option.active').dataset.value,
                    dedupe_mode: document.querySelector('#filter-dedupe-mode .toggle-option.active').dataset.value,
                    priority_list: priorityList,
                };

                try {
                    this.showLoading('Filtering files...');
                    await filterService.runFilter(filters);
                    if (stateService.get('finalFileList').length === 0) {
                        this.hideLoading();
                        await this.showConfirmationModal('No files matched your filters. Please adjust your filter settings and try again.', {
                            title: 'No Results',
                            confirmText: 'OK',
                            cancelText: null
                        });
                        return;
                    }
                    this.viewManager.showView('results', this.breadcrumbManager, this, this.searchManager);
                    this.downloadUI.populateResults();
                    const searchInput = document.getElementById('search-results');
                    if (searchInput) {
                        searchInput.dispatchEvent(new Event('input'));
                    }
                } catch (e) {
                    alert(`Error during filtering: ${e.message}`);
                } finally {
                    this.hideLoading();
                }
            });

            document.getElementById('reset-priorities-btn').addEventListener('click', () => {
                this.wizardManager.resetPriorityList();
            });

            const addAllPriorities = (sortFn) => {
                const availableList = document.getElementById('priority-available');
                const priorityList = document.getElementById('priority-list');
                const itemsToMove = Array.from(availableList.querySelectorAll('.list-group-item:not(.hidden)'));

                itemsToMove.sort(sortFn);
                itemsToMove.forEach(item => priorityList.appendChild(item));

                const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
                stateService.set('priorityList', updatedPriorityList);
                this.wizardManager.updatePriorityBuilderAvailableTags();
            };

            document.getElementById('add-all-shortest').addEventListener('click', () => {
                addAllPriorities((a, b) => a.textContent.length - b.textContent.length);
            });

            document.getElementById('add-all-longest').addEventListener('click', () => {
                addAllPriorities((a, b) => b.textContent.length - a.textContent.length);
            });
        } else if (viewId === 'results') {
            const createSubfolderCheckbox = document.getElementById('create-subfolder-checkbox');
            if (createSubfolderCheckbox) {
                createSubfolderCheckbox.checked = stateService.get('createSubfolder');
                createSubfolderCheckbox.addEventListener('change', (e) => {
                    stateService.set('createSubfolder', e.target.checked);
                });
            }
            setTimeout(() => {
                this.addInfoIconToElement('maintain-folder-structure-label', 'maintainSiteFolderStructure');
                this.addInfoIconToElement('create-subfolder-label', 'createSubfolder');

                const extractArchivesCheckbox = document.getElementById('extract-archives-checkbox');
                const extractPreviouslyDownloadedCheckbox = document.getElementById('extract-previously-downloaded-checkbox');

                if (extractArchivesCheckbox && extractPreviouslyDownloadedCheckbox) {
                    extractArchivesCheckbox.checked = stateService.get('extractAndDelete');
                    extractPreviouslyDownloadedCheckbox.checked = stateService.get('extractPreviouslyDownloaded');
                    extractPreviouslyDownloadedCheckbox.disabled = !extractArchivesCheckbox.checked;

                    extractArchivesCheckbox.addEventListener('change', (e) => {
                        const isChecked = e.target.checked;
                        stateService.set('extractAndDelete', isChecked);
                        extractPreviouslyDownloadedCheckbox.disabled = !isChecked;
                        if (!isChecked) {
                            extractPreviouslyDownloadedCheckbox.checked = false;
                            stateService.set('extractPreviouslyDownloaded', false);
                        }
                        if (this.downloadUI && typeof this.downloadUI.updateScanButtonText === 'function') {
                            this.downloadUI.updateScanButtonText();
                        }
                    });
                    this.addInfoIconToElement('extract-archives-label', 'extractArchives');

                    extractPreviouslyDownloadedCheckbox.addEventListener('change', (e) => {
                        stateService.set('extractPreviouslyDownloaded', e.target.checked);
                    });
                    this.addInfoIconToElement('extract-previously-downloaded-label', 'extractPreviouslyDownloaded');
                }

                this.addInfoIconToElement('download-options-label', 'downloadOptions');

                this.addInfoIconToElement('overall-download-progress-label', 'overallDownloadProgress');
                this.addInfoIconToElement('file-download-progress-label', 'fileDownloadProgress');
                this.addInfoIconToElement('overall-extraction-progress-label', 'overallExtractionProgress');
                this.addInfoIconToElement('file-extraction-progress-label', 'fileExtractionProgress');
            }, 0);

            document.getElementById('download-dir-btn').addEventListener('click', async () => {
                const dir = await downloadService.getDownloadDirectory();
                if (dir) {
                    document.getElementById('download-dir-text').textContent = dir;
                    stateService.set('downloadDirectory', dir);
                    document.getElementById('open-download-dir-btn').classList.remove('hidden');
                    if (this.downloadUI && typeof this.downloadUI.updateScanButtonState === 'function') {
                        this.downloadUI.updateScanButtonState();
                    }
                }
            });

            document.getElementById('open-download-dir-btn').addEventListener('click', () => {
                const dir = stateService.get('downloadDirectory');
                if (dir) {
                    shellService.openDirectory(dir);
                }
            });

            document.getElementById('download-scan-btn').addEventListener('click', () => this.downloadUI.startDownload());

            document.getElementById('download-cancel-btn').addEventListener('click', () => {
                if (this.downloadUI?.handleCancelClick) this.downloadUI.handleCancelClick();
                if (this.downloadUI?.downloadService) this.downloadUI.downloadService.cancelDownload();
            });

            document.getElementById('download-restart-btn').addEventListener('click', () => {
                stateService.set('archive', { name: '', href: '' });
                stateService.set('directory', { name: '', href: '' });
                stateService.resetWizardState();

                this.loadArchivesCallback();
            });
        }
    }
}

export default UIManager;