import { formatTime, formatBytes, parseSize } from '../../shared/utils/formatters.js';
import InfoIcon from './InfoIcon.js';
import tooltipContent from '../tooltipContent.js';
import VirtualList from './VirtualList.js';

/**
 * Manages the user interface elements and interactions related to the download process.
 * @class
 */
export default class DownloadUI {
  /**
   * Creates an instance of DownloadUI.
   * @param {StateService} stateService The StateService instance for managing application state.
   * @param {DownloadService} downloadService The DownloadService instance for interacting with download logic.
   * @param {UIManager} uiManager The UIManager instance for managing overall UI.
   */
  constructor(stateService, downloadService, uiManager) {
    this.stateService = stateService;
    this.downloadService = downloadService;
    this.uiManager = uiManager;
    this.downloadDirectoryStructure = null;
    this.resultsListChangeListener = null;
    this._isExtracting = false;
    this.downloadOptionsState = null;
    this.virtualList = null;
    this.selectedFileNames = new Set();
    this._setupEventListeners();
    if (window.electronAPI && window.electronAPI.onExtractionStarted) {
      window.electronAPI.onExtractionStarted(() => {
        this._isExtracting = true;
        this._setResultsInteraction(false);
        const elements = this._getElements();
        elements.overallExtractionProgressBar.classList.remove('hidden');
        elements.extractionProgressBar.classList.remove('hidden');
      });
    }
    if (window.electronAPI && window.electronAPI.onExtractionEnded) {
      window.electronAPI.onExtractionEnded(() => {
        this._isExtracting = false;
        if (!this.stateService.get('isDownloading')) {
          this._setResultsInteraction(true);
        }
        const elements = this._getElements();
        elements.overallExtractionProgressBar.classList.add('hidden');
        elements.extractionProgressBar.classList.add('hidden');
      });
    }
  }

  /**
   * Handles the click event for the cancel button, disabling it and logging a cancellation message.
   * @memberof DownloadUI
   */
  handleCancelClick() {
    const elements = this._getElements();
    if (elements.downloadCancelBtn) elements.downloadCancelBtn.disabled = true;
    this.log(this._isExtracting ? 'Cancelling extraction, please wait...' : 'Cancelling download, please wait...');
  }

  /**
   * Retrieves and returns an object containing references to various DOM elements used in the download UI.
   * @memberof DownloadUI
   * @returns {object} An object with keys as element IDs and values as the corresponding DOM elements.
   * @private
   */
  _getElements() {
    return {
      resultsFileCount: document.getElementById('results-file-count'),
      resultsTotalCount: document.getElementById('results-total-count'),
      resultsList: document.getElementById('results-list'),
      downloadDirText: document.getElementById('download-dir-text'),
      downloadScanBtn: document.getElementById('download-scan-btn'),
      scanProgressBar: document.getElementById('scan-progress-bar'),
      downloadProgressBars: document.getElementById('download-progress-bars'),
      downloadCancelBtn: document.getElementById('download-cancel-btn'),
      downloadRestartBtn: document.getElementById('download-restart-btn'),
      downloadLog: document.getElementById('download-log'),
      scanProgress: document.getElementById('scan-progress'),
      scanProgressText: document.getElementById('scan-progress-text'),
      overallProgress: document.getElementById('overall-progress'),
      overallProgressText: document.getElementById('overall-progress-text'),
      overallProgressTime: document.getElementById('overall-progress-time'),
      fileProgress: document.getElementById('file-progress'),
      fileProgressContainer: document.getElementById('file-progress-container'),
      fileProgressLabel: document.querySelector('label[for="file-progress"]'),
      fileProgressName: document.getElementById('file-progress-name'),
      fileProgressSize: document.getElementById('file-progress-size'),
      downloadDirBtn: document.getElementById('download-dir-btn'),
      extractionProgressBar: document.getElementById('extraction-progress-bar'),
      extractionProgress: document.getElementById('extraction-progress'),
      extractionProgressName: document.getElementById('extraction-progress-name'),
      extractionProgressText: document.getElementById('extraction-progress-text'),
      overallExtractionProgressBar: document.getElementById('overall-extraction-progress-bar'),
      overallExtractionProgress: document.getElementById('overall-extraction-progress'),
      overallExtractionProgressText: document.getElementById('overall-extraction-progress-text'),
      overallExtractionProgressTime: document.getElementById('overall-extraction-progress-time'),
      selectAllResultsBtn: document.getElementById('select-all-results-btn'),
      deselectAllResultsBtn: document.getElementById('deselect-all-results-btn'),
      resultsSelectedCount: document.getElementById('results-selected-count'),
      totalSelectedDownloadSizeDisplay: document.getElementById('total-selected-download-size'),
      createSubfolderCheckbox: document.getElementById('create-subfolder-checkbox'),
      createSubfolderLabel: document.querySelector('label[for="create-subfolder-checkbox"]'),
      maintainFolderStructureCheckbox: document.getElementById('maintain-folder-structure-checkbox'),
      throttleDownloadCheckbox: document.getElementById('throttle-download-checkbox'),
      throttleSpeedInput: document.getElementById('throttle-speed-input'),
      throttleUnitSelect: document.getElementById('throttle-unit-select'),
      extractArchivesCheckbox: document.getElementById('extract-archives-checkbox'),
      extractPreviouslyDownloadedCheckbox: document.getElementById('extract-previously-downloaded-checkbox'),
    };
  }

  /**
   * Retrieves all DOM elements related to the download options.
   * @memberof DownloadUI
   * @returns {object} An object containing the download option elements.
   * @private
   */
  _getDownloadOptionsElements() {
    const {
      maintainFolderStructureCheckbox,
      createSubfolderCheckbox,
      throttleDownloadCheckbox,
      throttleSpeedInput,
      throttleUnitSelect,
    } = this._getElements();

    return {
      maintainFolderStructureCheckbox,
      createSubfolderCheckbox,
      extractArchivesCheckbox: document.getElementById('extract-archives-checkbox'),
      extractPreviouslyDownloadedCheckbox: document.getElementById('extract-previously-downloaded-checkbox'),
      skipScanCheckbox: document.getElementById('skip-scan-checkbox'),
      throttleDownloadCheckbox,
      throttleSpeedInput,
      throttleUnitSelect,
    };
  }

  /**
   * Enables or disables user interaction with the results list and associated controls.
   * @memberof DownloadUI
   * @param {boolean} enabled - True to enable interaction, false to disable.
   * @private
   */
  _setResultsInteraction(enabled) {
    const elements = this._getElements();
    if (elements.selectAllResultsBtn) {
      elements.selectAllResultsBtn.disabled = !enabled;
    }
    if (elements.deselectAllResultsBtn) {
      elements.deselectAllResultsBtn.disabled = !enabled;
    }
    if (elements.resultsList) {
      elements.resultsList.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
        checkbox.disabled = !enabled;
      });
      if (enabled) {
        elements.resultsList.classList.remove('opacity-50', 'pointer-events-none');
      } else {
        elements.resultsList.classList.add('opacity-50', 'pointer-events-none');
      }
    }
  }

  /**
   * Saves the current state of download options and disables them.
   * @memberof DownloadUI
   * @private
   */
  _disableDownloadOptions() {
    const els = this._getDownloadOptionsElements();
    const controlsToSave = {
      maintain: els.maintainFolderStructureCheckbox,
      subfolder: els.createSubfolderCheckbox,
      extract: els.extractArchivesCheckbox,
      extractPrev: els.extractPreviouslyDownloadedCheckbox,
      skipScan: els.skipScanCheckbox,
      throttle: els.throttleDownloadCheckbox,
      throttleSpeed: els.throttleSpeedInput,
      throttleUnit: els.throttleUnitSelect,
    };

    this.downloadOptionsState = {};
    for (const key in controlsToSave) {
      const control = controlsToSave[key];
      if (control) {
        this.downloadOptionsState[key] = {
          checked: control.checked,
          disabled: control.disabled,
          value: control.value,
        };
        control.disabled = true;
        if (!key.startsWith('throttle')) {
          const label = control.closest('label');
          if (label) {
            label.classList.add('disabled-option');
          }
        }
      }
    }

    const throttleContainer = document.getElementById('throttle-container');
    if (throttleContainer) {
      throttleContainer.classList.add('disabled-option');
    }
    if (els.throttleSpeedInput && els.throttleUnitSelect) {
      els.throttleSpeedInput.classList.add('force-no-opacity');
      els.throttleUnitSelect.classList.add('force-no-opacity');
    }
  }

  /**
   * Restores the saved state of the download options.
   * @memberof DownloadUI
   * @private
   */
  _restoreDownloadOptions() {
    if (!this.downloadOptionsState) return;

    const els = this._getDownloadOptionsElements();
    const controlMap = {
      maintain: els.maintainFolderStructureCheckbox,
      subfolder: els.createSubfolderCheckbox,
      extract: els.extractArchivesCheckbox,
      extractPrev: els.extractPreviouslyDownloadedCheckbox,
      skipScan: els.skipScanCheckbox,
      throttle: els.throttleDownloadCheckbox,
      throttleSpeed: els.throttleSpeedInput,
      throttleUnit: els.throttleUnitSelect,
    };

    for (const key in this.downloadOptionsState) {
      const control = controlMap[key];
      const savedState = this.downloadOptionsState[key];
      if (control && savedState) {
        control.checked = savedState.checked;
        control.disabled = savedState.disabled;
        if (typeof savedState.value !== 'undefined') {
          control.value = savedState.value;
        }
        if (!key.startsWith('throttle')) {
          const label = control.closest('label');
          if (label) {
            if (key === 'extractPrev') {
              const extractCheckbox = controlMap.extract;
              if (extractCheckbox) {
                label.classList.toggle('disabled-option', !extractCheckbox.checked || savedState.disabled);
              }
            } else {
              label.classList.toggle('disabled-option', savedState.disabled);
            }
          }
        }
      }
    }

    const throttleContainer = document.getElementById('throttle-container');
    if (throttleContainer) {
      throttleContainer.classList.remove('disabled-option');
    }
    if (els.throttleSpeedInput && els.throttleUnitSelect) {
      els.throttleSpeedInput.classList.remove('force-no-opacity');
      els.throttleUnitSelect.classList.remove('force-no-opacity');
    }

    this.downloadOptionsState = null;
  }


  /**
   * Updates the displayed count of selected results.
   * @memberof DownloadUI
   */
  updateSelectedCount() {
    const elements = this._getElements();
    if (!elements.resultsSelectedCount) return;
    const selectedCount = this.stateService.get('selectedFilesForDownload').length;
    elements.resultsSelectedCount.innerHTML = `Selected to download: <span class="font-bold text-white">${selectedCount}</span>`;
  }

  /**
   * Updates the displayed total download size.
   * @memberof DownloadUI
   * @private
   */
  _updateTotalDownloadSizeDisplay() {
    const elements = this._getElements();
    if (!elements.totalSelectedDownloadSizeDisplay) return;
    const totalSize = this.stateService.get('totalSelectedDownloadSize');
    elements.totalSelectedDownloadSizeDisplay.textContent = formatBytes(totalSize);
  }

  /**
   * Updates the application's state with the currently selected download results based on UI checkboxes.
   * @memberof DownloadUI
   * @private
   */
  _updateSelectionState() {
    const elements = this._getElements();
    if (!elements.resultsList) {
      return;
    }

    const finalFileList = this.stateService.get('finalFileList');
    const fileMap = new Map(finalFileList.map(f => [f.name_raw.trim(), f]));
    const checkedCheckboxes = elements.resultsList.querySelectorAll('input[type=checkbox]:checked');

    const updatedSelectedResults = Array.from(checkedCheckboxes)
      .map(cb => {
        const name = cb.parentElement.dataset.name.trim();
        return fileMap.get(name);
      })
      .filter(Boolean);

    this.stateService.setSelectedFilesForDownload(updatedSelectedResults);
    this.updateSelectedCount();
    this._updateTotalDownloadSizeDisplay();
    this.updateScanButtonState();
  }
  /**
   * Updates the text of the Scan & Download button based on extract checkbox state.
   * @memberof DownloadUI
   */
  updateScanButtonText() {
    const elements = this._getElements();
    const scanBtn = elements.downloadScanBtn;
    const extractCheckbox = document.getElementById('extract-archives-checkbox');
    const skipScanCheckbox = document.getElementById('skip-scan-checkbox');

    if (scanBtn) {
      let text = '';
      if (skipScanCheckbox && skipScanCheckbox.checked) {
        text = 'Download Now';
        if (extractCheckbox && extractCheckbox.checked) {
          text = 'Download & Extract';
        }
      } else {
        text = 'Scan & Download';
        if (extractCheckbox && extractCheckbox.checked) {
          text = 'Scan, Download & Extract';
        }
      }
      scanBtn.textContent = text;
    }
  }

  /**
   * Updates the title (tooltip) of the Scan & Download button based on state.
   * @memberof DownloadUI
   */
  updateScanButtonTitle() {
    const elements = this._getElements();
    const scanBtn = elements.downloadScanBtn;
    if (scanBtn) {
      const selectedFilesForDownload = this.stateService.get('selectedFilesForDownload') || [];
      const noResults = selectedFilesForDownload.length === 0;
      const noDir = !this.stateService.get('downloadDirectory');
      if (noResults && noDir) {
        scanBtn.title = "Select at least one result and a target directory to enable downloading.";
      } else if (noResults) {
        scanBtn.title = "Select at least one result to enable downloading.";
      } else if (noDir) {
        scanBtn.title = "Select a target directory to enable downloading.";
      } else {
        scanBtn.title = '';
      }
    }
  }

  /**
   * Updates the enabled/disabled state, text, and tooltip of the Scan & Download button.
   * @memberof DownloadUI
   */
  updateScanButtonState() {
    const elements = this._getElements();
    const scanBtn = elements.downloadScanBtn;
    if (scanBtn) {
      const selectedFilesForDownload = this.stateService.get('selectedFilesForDownload') || [];
      const noResults = selectedFilesForDownload.length === 0;
      const noDir = !this.stateService.get('downloadDirectory');
      scanBtn.disabled = noResults || noDir;
      this.updateScanButtonText();
      this.updateScanButtonTitle();
    }
  }

  /**
   * Populates the results list in the UI with the final filtered file list.
   * Sets up event listeners for checkbox changes and resets download-related UI elements.
   * @memberof DownloadUI
   * @param {boolean} hasSubdirectories Indicates if the selected directory contains subdirectories.
   * @returns {Promise<void>}
   */
  async populateResults(hasSubdirectories = false) {
    const elements = this._getElements();
    const finalFileList = this.stateService.get('finalFileList') || [];
    elements.resultsFileCount.textContent = finalFileList.length;
    elements.resultsTotalCount.textContent = this.stateService.get('allFiles').length;

    // Set the initial selection state before rendering
    this.stateService.setSelectedFilesForDownload([...finalFileList]);
    this.selectedFileNames = new Set(finalFileList.map(f => f.name_raw));

    const rowRenderer = (item) => {
      const el = document.createElement('label');
      el.className = 'flex items-center p-2 bg-neutral-900 rounded-md space-x-2 cursor-pointer border border-transparent hover:border-accent-500 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500 select-none';
      el.dataset.name = item.name_raw;
      el.title = item.name_raw;
      el.tabIndex = 0;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'h-4 w-4';
      checkbox.checked = this.selectedFileNames.has(item.name_raw);
      el.appendChild(checkbox);

      const div = document.createElement('div');
      div.className = 'flex-grow min-w-0 flex-shrink-1';
      const spanName = document.createElement('span');
      spanName.className = 'text-neutral-300 truncate block';
      spanName.textContent = item.name_raw;
      div.appendChild(spanName);
      el.appendChild(div);

      const spanSize = document.createElement('span');
      spanSize.className = 'text-neutral-400 ml-auto whitespace-nowrap';
      spanSize.textContent = formatBytes(parseSize(item.size));
      el.appendChild(spanSize);

      return el;
    };

    if (this.virtualList) {
      this.virtualList.updateItems(finalFileList);
    } else {
      this.virtualList = new VirtualList(elements.resultsList, {
        items: finalFileList,
        rowRenderer,
        rowHeight: 40,
        spacing: 8,
      });
    }

    elements.createSubfolderCheckbox.checked = false;
    elements.createSubfolderCheckbox.disabled = false;
    this.stateService.set('createSubfolder', false);

    elements.maintainFolderStructureCheckbox.checked = false;
    this.stateService.set('maintainFolderStructure', false);

    const { throttleDownloadCheckbox, throttleSpeedInput, throttleUnitSelect, extractArchivesCheckbox, extractPreviouslyDownloadedCheckbox } = elements;
    if (extractArchivesCheckbox) {
      extractArchivesCheckbox.checked = false;
    }

    if (extractPreviouslyDownloadedCheckbox && extractArchivesCheckbox) {
      extractPreviouslyDownloadedCheckbox.checked = false;
      extractPreviouslyDownloadedCheckbox.disabled = !extractArchivesCheckbox.checked;
      const parentLabel = extractPreviouslyDownloadedCheckbox.closest('label');
      if (parentLabel) {
        if (!extractArchivesCheckbox.checked) {
          parentLabel.classList.add('disabled-option');
        } else {
          parentLabel.classList.remove('disabled-option');
        }
      }
    } else if (extractPreviouslyDownloadedCheckbox) {
      extractPreviouslyDownloadedCheckbox.checked = false;
      extractPreviouslyDownloadedCheckbox.disabled = true;
      const parentLabel = extractPreviouslyDownloadedCheckbox.closest('label');
      if (parentLabel) {
        parentLabel.classList.add('disabled-option');
      }
    }

    this.updateSelectedCount();
    this._updateTotalDownloadSizeDisplay();
    this.updateScanButtonState();

    if (this.resultsListChangeListener) {
      elements.resultsList.removeEventListener('change', this.resultsListChangeListener);
    }

    this.resultsListChangeListener = (e) => {
      if (e.target.type === 'checkbox') {
        const checkbox = e.target;
        const name = checkbox.parentElement.dataset.name.trim();

        if (checkbox.checked) {
          this.selectedFileNames.add(name);
        } else {
          this.selectedFileNames.delete(name);
        }

        const allFilesMap = new Map(this.stateService.get('finalFileList').map(f => [f.name_raw, f]));
        const newSelectedFiles = Array.from(this.selectedFileNames).map(name => allFilesMap.get(name)).filter(Boolean);

        this.stateService.setSelectedFilesForDownload(newSelectedFiles);

        this.updateSelectedCount();
        this._updateTotalDownloadSizeDisplay();
        this.updateScanButtonState();

        e.target.parentElement.focus();
      }
    };
    elements.resultsList.addEventListener('change', this.resultsListChangeListener);

    elements.downloadDirText.textContent = 'No directory selected.';
    elements.downloadScanBtn.disabled = true;
    this.stateService.set('downloadDirectory', null);
    elements.scanProgressBar.classList.add('hidden');
    elements.downloadProgressBars.classList.add('hidden');
    elements.downloadCancelBtn.classList.add('hidden');
    elements.downloadRestartBtn.classList.add('hidden');
    elements.downloadLog.innerHTML = '';

    if (!this.downloadDirectoryStructure) {
      this.downloadDirectoryStructure = await this.downloadService.getDownloadDirectoryStructureEnum();
    }
  }

  /**
   * Initiates the download process after performing necessary checks and UI updates.
   * Displays confirmation modals for directory structure mismatches.
   * @memberof DownloadUI
   */
  async startDownload() {
    const elements = this._getElements();
    if (!elements.downloadDirBtn) return;

    if (!this.stateService.get('downloadDirectory')) {
      alert("Please select a download directory first.");
      return;
    }

    const downloadPath = this.stateService.get('downloadDirectory');
    const createSubfolder = this.stateService.get('createSubfolder');
    const maintainFolderStructure = this.stateService.get('maintainFolderStructure');
    const isCreatingSubfolders = createSubfolder || maintainFolderStructure;

    const currentStructure = await this.downloadService.checkDownloadDirectoryStructure(downloadPath);

    let shouldProceed = true;
    let confirmationMessage = '';

    if (currentStructure === this.downloadDirectoryStructure.FLAT && isCreatingSubfolders) {
      confirmationMessage = `The target directory "${downloadPath}" contains flat files, but you have selected to create subfolders. Do you want to continue?`;
      shouldProceed = false;
    } else if (currentStructure === this.downloadDirectoryStructure.SUBFOLDERS && !isCreatingSubfolders) {
      confirmationMessage = `The target directory "${downloadPath}" contains subfolders, but you have selected to download files directly. Do you want to continue?`;
      shouldProceed = false;
    } else if (currentStructure === this.downloadDirectoryStructure.MIXED) {
      confirmationMessage = `The target directory "${downloadPath}" contains both flat files and subfolders. This might lead to an inconsistent structure. Do you want to continue?`;
      shouldProceed = false;
    }

    if (!shouldProceed) {
      const userConfirmed = await this.uiManager.showConfirmationModal(confirmationMessage, { title: 'File Structure Mismatch' });
      if (!userConfirmed) {
        return;
      }
    }

    this._setResultsInteraction(false);
    this._disableDownloadOptions();
    this.stateService.set('isDownloading', true);
    this.stateService.set('downloadStartTime', Date.now());
    this.stateService.set('totalBytesDownloadedThisSession', 0);

    elements.downloadLog.innerHTML = '';
    this.log('Starting download...');
    elements.downloadScanBtn.disabled = true;
    elements.downloadDirBtn.disabled = true;
    elements.downloadCancelBtn.classList.remove('hidden');
    elements.downloadRestartBtn.classList.add('hidden');

    elements.scanProgress.value = 0;
    elements.overallProgress.value = 0;
    elements.fileProgress.value = 0;
    elements.fileProgressName.textContent = "";
    elements.fileProgressSize.textContent = "";
    elements.overallProgressTime.textContent = "Estimated Time Remaining: --";
    elements.overallProgressText.textContent = "0.00 MB / 0.00 MB";

    elements.fileProgressLabel.classList.remove('hidden');

    elements.extractionProgress.value = 0;
    elements.overallExtractionProgress.value = 0;
    elements.overallExtractionProgressText.textContent = "";
    elements.overallExtractionProgressTime.textContent = "Estimated Time Remaining: --";
    elements.extractionProgressName.textContent = "";
    elements.extractionProgressText.textContent = "";

    elements.scanProgressBar.classList.remove('hidden');
    elements.downloadProgressBars.classList.remove('hidden');
    elements.extractionProgressBar.classList.add('hidden');
    elements.overallExtractionProgressBar.classList.add('hidden');

    this.downloadService.startDownload(this.stateService.get('selectedFilesForDownload'));
  }

  /**
   * Appends a message to the download log display.
   * @memberof DownloadUI
   * @param {string} message The message to log.
   */
  log(message) {
    const elements = this._getElements();
    if (!elements.downloadLog) return;
    const logEl = elements.downloadLog;
    logEl.innerHTML += `<div>${message}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  /**
   * Sets up all event listeners for UI interactions and IPC communications related to downloads.
   * @memberof DownloadUI
   * @private
   */
  _setupEventListeners() {
    window.electronAPI.onHideDownloadUi(() => {
      const elements = this._getElements();
      elements.scanProgressBar.classList.add('hidden');
      elements.downloadProgressBars.classList.add('hidden');
      elements.downloadCancelBtn.classList.add('hidden');
      elements.downloadRestartBtn.classList.add('hidden');
      elements.extractionProgressBar.classList.add('hidden');
      elements.overallExtractionProgressBar.classList.add('hidden');
      elements.fileProgress.classList.add('hidden');
      elements.fileProgressName.classList.add('hidden');
      elements.fileProgressSize.classList.add('hidden');
      elements.fileProgressLabel.classList.add('hidden');
      elements.extractionProgress.value = 0;
      elements.overallExtractionProgress.value = 0;
      elements.overallExtractionProgressText.textContent = "";
      elements.overallExtractionProgressTime.textContent = "Estimated Time Remaining: --";
      elements.extractionProgressName.textContent = "";
      elements.extractionProgressText.textContent = "";
    });
    document.addEventListener('click', (e) => {
      const elements = this._getElements();
      if (!elements.resultsList) return;

      if (e.target.id === 'select-all-results-btn') {
        const displayedItems = this.virtualList.items;
        displayedItems.forEach(item => this.selectedFileNames.add(item.name_raw));
        
        const allFilesMap = new Map(this.stateService.get('finalFileList').map(f => [f.name_raw, f]));
        const newSelectedFiles = Array.from(this.selectedFileNames).map(name => allFilesMap.get(name)).filter(Boolean);
        this.stateService.setSelectedFilesForDownload(newSelectedFiles);

        this._updateTotalDownloadSizeDisplay();
        this.updateSelectedCount();
        this.updateScanButtonState();
        this.virtualList.displayItems(displayedItems);
      }

      if (e.target.id === 'deselect-all-results-btn') {
        const displayedItems = this.virtualList.items;
        const displayedItemNames = new Set(displayedItems.map(item => item.name_raw));
        
        displayedItemNames.forEach(name => this.selectedFileNames.delete(name));
        
        const allFilesMap = new Map(this.stateService.get('finalFileList').map(f => [f.name_raw, f]));
        const newSelectedFiles = Array.from(this.selectedFileNames).map(name => allFilesMap.get(name)).filter(Boolean);
        this.stateService.setSelectedFilesForDownload(newSelectedFiles);

        this._updateTotalDownloadSizeDisplay();
        this.updateSelectedCount();
        this.updateScanButtonState();
        this.virtualList.displayItems(displayedItems);
      }
    });

    document.addEventListener('change', (e) => {
      const {
        throttleSpeedInput,
        throttleUnitSelect,
        createSubfolderCheckbox,
        maintainFolderStructureCheckbox
      } = this._getElements();

      if (e.target.id === 'throttle-download-checkbox') {
        const isThrottlingEnabled = e.target.checked;
        throttleSpeedInput.disabled = !isThrottlingEnabled;
        throttleUnitSelect.disabled = !isThrottlingEnabled;
        this.stateService.set('isThrottlingEnabled', isThrottlingEnabled);
        if (isThrottlingEnabled) {
          this.stateService.set('throttleSpeed', parseInt(throttleSpeedInput.value, 10));
          this.stateService.set('throttleUnit', throttleUnitSelect.value);
        }
      }

      if (e.target.id === 'throttle-speed-input') {
        this.stateService.set('throttleSpeed', parseInt(e.target.value, 10));
      }

      if (e.target.id === 'throttle-unit-select') {
        this.stateService.set('throttleUnit', e.target.value);
      }

      if (e.target.id === 'create-subfolder-checkbox' && !e.target.disabled) {
        const isChecked = e.target.checked;
        this.stateService.set('createSubfolder', isChecked);
        if (maintainFolderStructureCheckbox) {
          maintainFolderStructureCheckbox.disabled = isChecked;
          const label = maintainFolderStructureCheckbox.closest('label');
          if (label) {
            label.classList.toggle('disabled-option', isChecked);
          }
          if (isChecked) {
            maintainFolderStructureCheckbox.checked = false;
            this.stateService.set('maintainFolderStructure', false);
          }
        }
      }

      if (e.target.id === 'maintain-folder-structure-checkbox' && !e.target.disabled) {
        const isChecked = e.target.checked;
        this.stateService.set('maintainFolderStructure', isChecked);
        if (createSubfolderCheckbox) {
          createSubfolderCheckbox.disabled = isChecked;
          const label = createSubfolderCheckbox.closest('label');
          if (label) {
            label.classList.toggle('disabled-option', isChecked);
          }
          if (isChecked) {
            createSubfolderCheckbox.checked = false;
            this.stateService.set('createSubfolder', false);
          }
        }
      }

      if (e.target.id === 'extract-archives-checkbox') {
        const extractPreviouslyDownloadedCheckbox = document.getElementById('extract-previously-downloaded-checkbox');
        if (extractPreviouslyDownloadedCheckbox) {
          extractPreviouslyDownloadedCheckbox.disabled = !e.target.checked;
          const parentLabel = extractPreviouslyDownloadedCheckbox.closest('label');
          if (parentLabel) {
            if (!e.target.checked) {
              parentLabel.classList.add('disabled-option');
            } else {
              parentLabel.classList.remove('disabled-option');
            }
          }
          if (!e.target.checked) {
            extractPreviouslyDownloadedCheckbox.checked = false;
          }
        }
      }

      if (e.target.id === 'skip-scan-checkbox') {
        this.updateScanButtonText();
      }
    });

    window.electronAPI.onDownloadScanProgress(data => {
      const elements = this._getElements();
      if (!elements.scanProgress) return;
      const percent = data.total > 0 ? (data.current / data.total) * 100 : 0;
      elements.scanProgress.value = percent;
      const percentFixed = percent.toFixed(0);
      elements.scanProgressText.textContent = `${percentFixed}% (${data.current} / ${data.total} files)`;
    });

    window.electronAPI.onDownloadOverallProgress(async data => {
      const elements = this._getElements();
      if (!elements.overallProgress) return;

      if (data.isFinal) {
        elements.overallProgress.value = 100;
        elements.overallProgressText.textContent =
          `${await formatBytes(data.total)} / ${await formatBytes(data.total)} (100%)`;
        elements.overallProgressTime.textContent = 'Estimated Time Remaining: --';
      } else {
        const percent = data.total > 0 ? (data.current / data.total) * 100 : 0;
        elements.overallProgress.value = percent;
        const percentFixed = percent.toFixed(1);
        elements.overallProgressText.textContent =
          `${await formatBytes(data.current)} / ${await formatBytes(data.total)} (${percentFixed}%)`;

        this.stateService.set('totalBytesDownloadedThisSession', data.current - data.skippedSize);

        const timeElapsed = (Date.now() - this.stateService.get('downloadStartTime')) / 1000;

        if (timeElapsed > 1 && this.stateService.get('totalBytesDownloadedThisSession') > 0) {
          const avgSpeed = this.stateService.get('totalBytesDownloadedThisSession') / timeElapsed;
          const sizeRemaining = data.total - data.current;

          if (avgSpeed > 0 && sizeRemaining > 0) {
            const secondsRemaining = sizeRemaining / avgSpeed;
            elements.overallProgressTime.textContent = `Estimated Time Remaining: ${formatTime(secondsRemaining)}`;
          } else {
            elements.overallProgressTime.textContent = "Estimated Time Remaining: --";
          }
        }
      }
    });

    window.electronAPI.onDownloadFileProgress(async data => {
      const elements = this._getElements();
      if (!elements.fileProgress) return;

      elements.fileProgressContainer.classList.remove('hidden');

      const newFileNameText = `${data.name} (${data.currentFileIndex}/${data.totalFilesToDownload})`;
      if (elements.fileProgressName.textContent !== newFileNameText) {
        elements.fileProgress.value = 0;
        elements.fileProgressName.textContent = newFileNameText;
      }

      const percent = data.total > 0 ? (data.current / data.total) * 100 : 0;
      elements.fileProgress.value = percent;
      const percentFixed = percent.toFixed(0);
      elements.fileProgressSize.textContent =
        `${await formatBytes(data.current)} / ${await formatBytes(data.total)} (${percentFixed}%)`;
    });

    window.electronAPI.onDownloadLog(message => {
      this.log(message);
    });

    window.electronAPI.onDownloadComplete((summary) => {
      this.stateService.set('isDownloading', false);
      this._restoreDownloadOptions();

      const elements = this._getElements();
      if (elements.overallProgress) elements.overallProgress.value = 100;
      if (elements.overallProgressText) elements.overallProgressText.textContent = 'Completed';
      if (elements.downloadScanBtn) elements.downloadScanBtn.disabled = false;
      if (elements.downloadDirBtn) elements.downloadDirBtn.disabled = false;
      if (elements.downloadCancelBtn) {
        elements.downloadCancelBtn.classList.add('hidden');
        elements.downloadCancelBtn.disabled = false;
      }
      if (elements.overallProgressTime) elements.overallProgressTime.textContent = 'Estimated Time Remaining: --';
      if (elements.downloadRestartBtn) elements.downloadRestartBtn.classList.remove('hidden');

      if (elements.fileProgressContainer) {
        elements.fileProgressContainer.classList.add('hidden');
      }

      if (!this._isExtracting) {
        this._setResultsInteraction(true);
      }
    });

    window.electronAPI.onExtractionProgress(async data => {
      const elements = this._getElements();
      if (!elements.extractionProgress) return;

      const overallExtractionProgressBar = document.getElementById('overall-extraction-progress-bar');
      if (data.totalUncompressedSizeOfAllArchives > 0) {
        const overallPercent = data.totalUncompressedSizeOfAllArchives > 0 ? (data.overallExtractedBytes / data.totalUncompressedSizeOfAllArchives) * 100 : 0;
        elements.overallExtractionProgress.value = overallPercent;
        const overallPercentFixed = overallPercent.toFixed(1);
        elements.overallExtractionProgressText.textContent = `${await formatBytes(data.overallExtractedBytes)} / ${await formatBytes(data.totalUncompressedSizeOfAllArchives)} (${overallPercentFixed}%)`;
        if (data.eta !== undefined) {
          elements.overallExtractionProgressTime.textContent = `Estimated Time Remaining: ${data.eta}`;
        } else {
          elements.overallExtractionProgressTime.textContent = "Estimated Time Remaining: --";
        }
      }

      const extractionProgressBar = document.getElementById('extraction-progress-bar');
      if (data.fileTotal > 0) {
        const filePercent = data.fileTotal > 0 ? (data.fileProgress / data.fileTotal) * 100 : 0;
        elements.extractionProgress.value = filePercent;
        const filePercentFixed = filePercent.toFixed(0);
        elements.extractionProgressName.textContent = `${data.filename} (${data.overallExtractedEntryCount}/${data.totalEntriesOverall})`;
        elements.extractionProgressText.textContent = `${await formatBytes(data.fileProgress)} / ${await formatBytes(data.fileTotal)} (${filePercentFixed}%)`;
      }
    });
  }
  
  /**
   * Destroys the virtual list instance.
   * @memberof DownloadUI
   */
  destroy() {
    if (this.virtualList) {
      this.virtualList.destroy();
      this.virtualList = null;
    }
  }
}
