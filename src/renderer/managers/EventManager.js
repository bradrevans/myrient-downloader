import stateService from '../StateService.js';
import filterService from '../services/FilterService.js';
import downloadService from '../services/DownloadService.js';
import shellService from '../services/ShellService.js';

/**
 * Manages event listeners for different views in the renderer process.
 * It orchestrates user interactions with the UI components.
 * @class
 */
class EventManager {
    /**
     * Creates an instance of EventManager.
     * @param {UIManager} uiManager The UIManager instance.
     * @param {function(): void} loadArchivesCallback Callback function to load archives.
     */
    constructor(uiManager, loadArchivesCallback) {
        this.uiManager = uiManager;
        this.loadArchivesCallback = loadArchivesCallback;
    }

    /**
     * Adds event listeners specific to the given view ID.
     * @memberof EventManager
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
                    this.uiManager.showLoading('Filtering files...');
                    await filterService.runFilter(filters);
                    if (stateService.get('finalFileList').length === 0) {
                        this.uiManager.hideLoading();
                        await this.uiManager.showConfirmationModal('No files matched your filters. Please adjust your filter settings and try again.', {
                            title: 'No Results',
                            confirmText: 'OK',
                            cancelText: null
                        });
                        return;
                    }
                    this.uiManager.viewManager.showView('results', this.uiManager.breadcrumbManager, this, this.uiManager.searchManager);
                    this.uiManager.downloadUI.populateResults();
                    const searchInput = document.getElementById('search-results');
                    if (searchInput) {
                        searchInput.dispatchEvent(new Event('input'));
                    }
                } catch (e) {
                    alert(`Error during filtering: ${e.message}`);
                } finally {
                    this.uiManager.hideLoading();
                }
            });

            document.getElementById('reset-priorities-btn').addEventListener('click', () => {
                this.uiManager.wizardManager.resetPriorityList();
            });

            const addAllPriorities = (sortFn) => {
                const availableList = document.getElementById('priority-available');
                const priorityList = document.getElementById('priority-list');
                const itemsToMove = Array.from(availableList.querySelectorAll('.list-group-item:not(.hidden)'));

                itemsToMove.sort(sortFn);
                itemsToMove.forEach(item => priorityList.appendChild(item));

                const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
                stateService.set('priorityList', updatedPriorityList);
                this.uiManager.wizardManager.updatePriorityBuilderAvailableTags();
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
                this.uiManager.addInfoIconToElement('maintain-folder-structure-label', 'maintainSiteFolderStructure');
                this.uiManager.addInfoIconToElement('create-subfolder-label', 'createSubfolder');

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
                        if (this.uiManager.downloadUI && typeof this.uiManager.downloadUI.updateScanButtonText === 'function') {
                            this.uiManager.downloadUI.updateScanButtonText();
                        }
                    });
                    this.uiManager.addInfoIconToElement('extract-archives-label', 'extractArchives');

                    extractPreviouslyDownloadedCheckbox.addEventListener('change', (e) => {
                        stateService.set('extractPreviouslyDownloaded', e.target.checked);
                    });
                    this.uiManager.addInfoIconToElement('extract-previously-downloaded-label', 'extractPreviouslyDownloaded');
                }

                this.uiManager.addInfoIconToElement('download-options-label', 'downloadOptions');

                this.uiManager.addInfoIconToElement('overall-download-progress-label', 'overallDownloadProgress');
                this.uiManager.addInfoIconToElement('file-download-progress-label', 'fileDownloadProgress');
                this.uiManager.addInfoIconToElement('overall-extraction-progress-label', 'overallExtractionProgress');
                this.uiManager.addInfoIconToElement('file-extraction-progress-label', 'fileExtractionProgress');
            }, 0);

            document.getElementById('download-dir-btn').addEventListener('click', async () => {
                const dir = await downloadService.getDownloadDirectory();
                if (dir) {
                    document.getElementById('download-dir-text').textContent = dir;
                    stateService.set('downloadDirectory', dir);
                    document.getElementById('open-download-dir-btn').classList.remove('hidden');
                    if (this.uiManager.downloadUI && typeof this.uiManager.downloadUI.updateScanButtonState === 'function') {
                        this.uiManager.downloadUI.updateScanButtonState();
                    }
                }
            });

            document.getElementById('open-download-dir-btn').addEventListener('click', () => {
                const dir = stateService.get('downloadDirectory');
                if (dir) {
                    shellService.openDirectory(dir);
                }
            });

            document.getElementById('download-scan-btn').addEventListener('click', () => this.uiManager.downloadUI.startDownload());

            document.getElementById('download-cancel-btn').addEventListener('click', () => {
                if (this.uiManager.downloadUI?.handleCancelClick) this.uiManager.downloadUI.handleCancelClick();
                if (this.uiManager.downloadUI?.downloadService) this.uiManager.downloadUI.downloadService.cancelDownload();
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

export default EventManager;
