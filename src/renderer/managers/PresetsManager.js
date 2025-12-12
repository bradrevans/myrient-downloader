import stateService from '../StateService.js';
import toastManager from './ToastManager.js';

/**
 * Manages the presets panel, handling the display, interaction, and management of filter presets.
 * @class
 */
class PresetsManager {
  /**
   * Creates an instance of PresetsManager.
   * @param {HTMLElement} viewContainer - The DOM element containing the presets UI.
   * @param {object} stateService - The application's state management service.
   */
  constructor(viewContainer, stateService) {
    this.viewContainer = viewContainer;
    this.uiManager = null;
    this.stateService = stateService;

    this.stateService.subscribe('savedFilters', () => {
      this.renderPresets();
    });
  }

  /**
   * Sets the UIManager instance for this manager.
   * @param {object} uiManager - The UIManager instance.
   */
  setUIManager(uiManager) {
    this.uiManager = uiManager;
  }

  /**
   * Loads filter presets from the main process and updates the state.
   * @async
   */
  async loadPresets() {
    const filters = await window.electronAPI.getFilters();
    this.stateService.set('savedFilters', filters);
  }

  /**
   * Renders the list of saved presets, grouped by archive and directory.
   */
  renderPresets() {
    const presetsList = this.viewContainer.querySelector('#presets-list');
    presetsList.innerHTML = '';

    const presets = this.stateService.get('savedFilters');
    const hasPresets = presets && presets.length > 0;

    const setButtonsDisabled = (disabled) => {
      this.viewContainer.querySelector('#select-all-btn').disabled = disabled;
      this.viewContainer.querySelector('#deselect-all-btn').disabled = disabled;
      this.viewContainer.querySelector('#export-all-btn').disabled = disabled;
      this.viewContainer.querySelector('#export-selected-btn').disabled = disabled;
      this.viewContainer.querySelector('#delete-selected-btn').disabled = disabled;
    };

    if (!hasPresets) {
      presetsList.innerHTML = '<p class="text-left text-gray-400">No presets found.</p>';
      setButtonsDisabled(true);
      return;
    }

    setButtonsDisabled(false);

    const groupedPresets = presets.reduce((acc, preset) => {
      const key = preset.pathDisplayName || 'Uncategorized';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(preset);
      return acc;
    }, {});

    for (const group in groupedPresets) {
      const groupContainer = document.createElement('div');
      const groupId = group.replace(/\s+/g, '-').toLowerCase();
      groupContainer.classList.add('mb-4', 'p-4', 'border', 'border-neutral-700', 'rounded-lg');
      groupContainer.dataset.groupId = groupId;

      const groupHeader = document.createElement('div');
      groupHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');

      const groupHeading = document.createElement('h3');
      groupHeading.classList.add('text-lg', 'font-semibold');
      groupHeading.textContent = group;
      groupHeader.appendChild(groupHeading);

      const groupButtons = document.createElement('div');
      groupButtons.classList.add('flex', 'space-x-2');
      groupButtons.innerHTML = `
                <button class="btn btn-secondary btn-sm select-all-group-btn" data-group-id="${groupId}">Select All</button>
                <button class="btn btn-secondary btn-sm deselect-all-group-btn" data-group-id="${groupId}">Deselect All</button>
            `;
      groupHeader.appendChild(groupButtons);
      groupContainer.appendChild(groupHeader);

      const presetItemsContainer = document.createElement('div');
      presetItemsContainer.classList.add('space-y-2');

      groupedPresets[group].forEach(preset => {
        const presetElement = document.createElement('div');
        presetElement.classList.add('flex', 'items-center', 'justify-between', 'p-2', 'bg-neutral-800', 'rounded-md', 'space-x-2', 'border', 'border-transparent');
        presetElement.innerHTML = `
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" class="h-4 w-4" data-preset-name="${preset.name}" data-preset-full-path="${preset.fullPath}">
                        <span class="text-neutral-300 ml-2">${preset.name}</span>
                    </label>
                    <button class="delete-preset-btn text-red-500 hover:text-red-700" data-preset-name="${preset.name}" data-preset-full-path="${preset.fullPath}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `;
        presetItemsContainer.appendChild(presetElement);
      });
      groupContainer.appendChild(presetItemsContainer);
      presetsList.appendChild(groupContainer);
    }
    this.updateButtonStates();
  }

  /**
   * Initializes tooltips for the presets panel.
   */
  initializePresetsTooltips() {
    this.uiManager.addInfoIconToElement('manage-presets-heading', 'managePresetsHeading');
  }

  /**
   * Adds event listeners for the preset management controls (import, export, delete, etc.).
   */
  addEventListeners() {
    const importButton = this.viewContainer.querySelector('#import-presets-btn');
    const exportAllButton = this.viewContainer.querySelector('#export-all-btn');
    const exportButton = this.viewContainer.querySelector('#export-selected-btn');
    const deleteSelectedBtn = this.viewContainer.querySelector('#delete-selected-btn');
    const selectAllBtn = this.viewContainer.querySelector('#select-all-btn');
    const deselectAllBtn = this.viewContainer.querySelector('#deselect-all-btn');


    importButton.addEventListener('click', async () => {
      const result = await window.electronAPI.importFilters();
      if (result.status === 'success') {
        toastManager.showToast('Presets imported successfully.');
        await this.loadPresets();
      } else if (result.status === 'error') {
        toastManager.showToast(result.message, 'error');
      }
    });

    exportAllButton.addEventListener('click', async () => {
      const result = await window.electronAPI.exportFilters();
      if (result.success) {
        toastManager.showToast(result.message);
      } else if (!result.success && result.message !== 'Export cancelled.') {
        toastManager.showToast(result.message, 'error');
      }
    });

    exportButton.addEventListener('click', async () => {
      const selectedPresets = this.getSelectedPresets();
      if (selectedPresets.length > 0) {
        const result = await window.electronAPI.exportSelectedFilters(selectedPresets);
        if (result.success) {
          toastManager.showToast(result.message);
        } else if (!result.success && result.message !== 'Export cancelled.') {
          toastManager.showToast(result.message, 'error');
        }
      } else {
        toastManager.showToast('No presets selected for export.', 'error');
      }
    });

    deleteSelectedBtn.addEventListener('click', async () => {
      const selectedPresets = this.getSelectedPresets();
      if (selectedPresets.length > 0) {
        await this.deletePresets(selectedPresets);
      }
    });

    selectAllBtn.addEventListener('click', () => {
      this.viewContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
      });
      this.updateButtonStates();
    });

    deselectAllBtn.addEventListener('click', () => {
      this.viewContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
      this.updateButtonStates();
    });

    const presetsList = this.viewContainer.querySelector('#presets-list');
    presetsList.addEventListener('click', async (e) => {
      const target = e.target;
      if (target.closest('.delete-preset-btn')) {
        const deleteButton = target.closest('.delete-preset-btn');
        const presetName = deleteButton.dataset.presetName;
        const fullPath = deleteButton.dataset.presetFullPath;
        const presets = this.stateService.get('savedFilters');
        const presetToDelete = presets.find(p => p.name === presetName && p.fullPath === fullPath);
        if (presetToDelete) {
          await this.deletePreset(presetToDelete);
        }
      } else if (target.classList.contains('select-all-group-btn')) {
        const groupId = target.dataset.groupId;
        const groupContainer = this.viewContainer.querySelector(`[data-group-id="${groupId}"]`);
        groupContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = true);
        this.updateButtonStates();
      } else if (target.classList.contains('deselect-all-group-btn')) {
        const groupId = target.dataset.groupId;
        const groupContainer = this.viewContainer.querySelector(`[data-group-id="${groupId}"]`);
        groupContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        this.updateButtonStates();
      } else if (target.matches('input[type="checkbox"]')) {
        this.updateButtonStates();
      }
    });
  }

  /**
   * Updates the enabled/disabled state of the 'Export Selected' and 'Delete Selected' buttons.
   */
  updateButtonStates() {
    const selectedCount = this.getSelectedPresets().length;
    const exportSelectedBtn = this.viewContainer.querySelector('#export-selected-btn');
    const deleteSelectedBtn = this.viewContainer.querySelector('#delete-selected-btn');

    if (exportSelectedBtn) exportSelectedBtn.disabled = selectedCount === 0;
    if (deleteSelectedBtn) deleteSelectedBtn.disabled = selectedCount === 0;
  }

  /**
   * Deletes a single preset after confirmation from the user.
   * @param {object} preset - The preset object to delete.
   * @async
   */
  async deletePreset(preset) {
    const confirmed = await this.uiManager.showConfirmationModal(
      `Are you sure you want to delete the preset "${preset.name}"?`, {
      title: 'Delete Preset',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'btn-danger'
    }
    );
    if (confirmed) {
      await window.electronAPI.deleteFilter(preset);
      toastManager.showToast(`Preset "${preset.name}" deleted.`);
      await this.loadPresets();
    }
  }

  /**
   * Deletes multiple presets after confirmation from the user.
   * @param {Array<object>} presets - An array of preset objects to delete.
   * @async
   */
  async deletePresets(presets) {
    const confirmed = await this.uiManager.showConfirmationModal(
      `Are you sure you want to delete ${presets.length} presets?`, {
      title: 'Delete Presets',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'btn-danger'
    }
    );
    if (confirmed) {
      await window.electronAPI.deleteFilters(presets);
      toastManager.showToast(`${presets.length} presets deleted.`);
      await this.loadPresets();
    }
  }

  /**
   * Gets an array of the currently selected preset objects.
   * @returns {Array<object>} An array of the selected preset objects.
   */
  getSelectedPresets() {
    const selectedPresets = [];
    const checkboxes = this.viewContainer.querySelectorAll('input[type="checkbox"]:checked');
    const allPresets = this.stateService.get('savedFilters');
    checkboxes.forEach(checkbox => {
      const presetName = checkbox.dataset.presetName;
      const fullPath = checkbox.dataset.presetFullPath;
      const preset = allPresets.find(p => p.name === presetName && p.fullPath === fullPath);
      if (preset) {
        selectedPresets.push(preset);
      }
    });
    return selectedPresets;
  }
}

export default PresetsManager;
