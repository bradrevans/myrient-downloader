import stateService from '../StateService.js';
import filterPersistenceService from '../services/FilterPersistenceService.js';
import toastManager from './ToastManager.js';

/**
 * Manages the wizard interface, handling setup of filters, tag categorization, and priority lists.
 * @class
 */
class WizardManager {
  /**
   * Creates an instance of WizardManager.
   * @param {UIManager} uiManager The UIManager instance.
   */
  constructor(uiManager) {
    this.uiManager = uiManager;

    stateService.subscribe('savedFilters', (updatedFilters) => {
      this._repopulatePresetsSelect(updatedFilters);
    });
  }

  /**
   * Repopulates the filter presets dropdown with relevant filters for the current context.
   * @param {Array<object>} filters - The list of all saved filters.
   * @private
   */
  _repopulatePresetsSelect(filters) {
    if (!this.presetsSelect) {
      return;
    }

    const previousSelection = this.presetsSelect.value;
    const currentArchiveHref = stateService.get('archive')?.href;
    const currentDirectoryHref = stateService.get('directory')?.href;

    const relevantFilters = filters ? filters.filter(f => f.archiveHref === currentArchiveHref && f.directoryHref === currentDirectoryHref) : [];

    if (relevantFilters.length === 0) {
      this.presetsSelect.innerHTML = '<option value="">No saved presets...</option>';
      this.presetsSelect.disabled = true;
    } else {
      this.presetsSelect.disabled = false;
      this.presetsSelect.innerHTML = '<option value="">Select a preset...</option>';
      let foundPreviousSelection = false;

      relevantFilters.forEach(filter => {
        const option = document.createElement('option');
        option.value = filter.name;
        option.textContent = filter.name;
        this.presetsSelect.appendChild(option);
        if (filter.name === previousSelection) {
          foundPreviousSelection = true;
        }
      });

      if (foundPreviousSelection) {
        this.presetsSelect.value = previousSelection;
      } else {
        this.presetsSelect.value = '';
      }
    }
  }

  /**
   * Loads filter presets from storage and updates the application state.
   * @private
   */
  async _loadAndPopulatePresets() {
    const filters = await filterPersistenceService.getFilters();
    stateService.set('savedFilters', filters);
  }

  /**
   * Updates the wizard UI to reflect the current state (e.g., toggles, tag lists).
   * @private
   */
  _updateUIFromState() {
    const revisionToggle = document.getElementById('filter-revision-mode');
    const revisionOptions = revisionToggle.querySelectorAll('.toggle-option');
    const currentRevisionMode = stateService.get('revisionMode');
    revisionOptions.forEach(option => option.classList.toggle('active', option.dataset.value === currentRevisionMode));

    const dedupeToggle = document.getElementById('filter-dedupe-mode');
    const dedupeOptions = dedupeToggle.querySelectorAll('.toggle-option');
    const currentDedupeMode = stateService.get('dedupeMode');
    dedupeOptions.forEach(option => option.classList.toggle('active', option.dataset.value === currentDedupeMode));
    document.getElementById('priority-builder-ui').classList.toggle('hidden', currentDedupeMode !== 'priority');

    const allTags = stateService.get('allTags');
    document.getElementById('wizard-file-count').textContent = stateService.get('allFiles').length;
    document.getElementById('wizard-tag-count').textContent = Object.values(allTags).reduce((sum, tags) => sum + tags.length, 0);

    this.populateTagCategory('region', allTags.Region || [], stateService.get('includeTags').region, stateService.get('excludeTags').region);
    this.populateTagCategory('language', allTags.Language || [], stateService.get('includeTags').language, stateService.get('excludeTags').language);
    this.populateTagCategory('other', allTags.Other || [], stateService.get('includeTags').other, stateService.get('excludeTags').other);

    const priorityListEl = document.getElementById('priority-list');
    priorityListEl.innerHTML = '';
    stateService.get('priorityList').forEach(tag => {
      const el = document.createElement('div');
      el.className = 'list-group-item';
      el.textContent = tag;
      el.dataset.name = tag;
      priorityListEl.appendChild(el);
    });

    this.updatePriorityBuilderAvailableTags();
  }

  /**
   * Attaches event listeners to the wizard's UI elements.
   * @private
   */
  _attachEventListeners() {
    this.presetsSelect.addEventListener('change', () => {
      const selectedPresetName = this.presetsSelect.value;
      this.savePresetNameInput.value = selectedPresetName;
      if (selectedPresetName) {
        const preset = stateService.get('savedFilters').find(f => f.name === selectedPresetName);
        if (preset) {
          stateService.set('includeTags', JSON.parse(JSON.stringify(preset.filterSettings.include_tags)));
          stateService.set('excludeTags', JSON.parse(JSON.stringify(preset.filterSettings.exclude_tags)));
          stateService.set('revisionMode', preset.filterSettings.rev_mode);
          stateService.set('dedupeMode', preset.filterSettings.dedupe_mode);
          stateService.set('priorityList', [...preset.filterSettings.priority_list]);
          this._updateUIFromState();
        }
      } else {
        stateService.resetWizardState();
        this._updateUIFromState();
      }
    });

    this.savePresetBtn.addEventListener('click', async () => {
      const presetName = this.savePresetNameInput.value.trim();
      if (!presetName) return alert('Please enter a name for the preset.');

      const currentArchiveHref = stateService.get('archive')?.href;
      const currentDirectoryHref = stateService.get('directory')?.href;
      const existingPreset = stateService.get('savedFilters').find(f => f.name === presetName && f.archiveHref === currentArchiveHref && f.directoryHref === currentDirectoryHref);

      if (existingPreset) {
        const userConfirmed = await this.uiManager.showConfirmationModal(
          `A preset named "${presetName}" already exists for this platform. Do you want to overwrite it?`,
          { confirmText: 'Overwrite' }
        );
        if (!userConfirmed) {
          return;
        }
      }

      const newFilter = {
        name: presetName,
        archiveName: stateService.get('archive')?.name,
        archiveHref: stateService.get('archive')?.href,
        directoryName: stateService.get('directory')?.name,
        directoryHref: stateService.get('directory')?.href,
        filterSettings: {
          include_tags: stateService.get('includeTags'),
          exclude_tags: stateService.get('excludeTags'),
          rev_mode: stateService.get('revisionMode'),
          dedupe_mode: stateService.get('dedupeMode'),
          priority_list: stateService.get('priorityList')
        }
      };
      await filterPersistenceService.saveFilter(newFilter);
      toastManager.showToast(`Preset "${presetName}" saved.`);
      this.savePresetNameInput.value = '';
      await this._loadAndPopulatePresets();
      this.presetsSelect.value = presetName;
    });

    document.getElementById('filter-revision-mode').querySelectorAll('.toggle-option').forEach(option => {
      option.addEventListener('click', () => {
        stateService.set('revisionMode', option.dataset.value);
        this._updateUIFromState();
      });
    });

    document.getElementById('filter-dedupe-mode').querySelectorAll('.toggle-option').forEach(option => {
      option.addEventListener('click', () => {
        stateService.set('dedupeMode', option.dataset.value);
        this._updateUIFromState();
      });
    });

    ['region', 'language', 'other'].forEach(category => {
      document.getElementById(`wizard-tags-list-${category}-include`).addEventListener('change', this._handleTagClick.bind(this));
      document.getElementById(`wizard-tags-list-${category}-exclude`).addEventListener('change', this._handleTagClick.bind(this));
      document.getElementById(`select-all-tags-${category}-include-btn`).addEventListener('click', () => this._massUpdateTags(category, 'include', true));
      document.getElementById(`deselect-all-tags-${category}-include-btn`).addEventListener('click', () => this._massUpdateTags(category, 'include', false));
      document.getElementById(`select-all-tags-${category}-exclude-btn`).addEventListener('click', () => this._massUpdateTags(category, 'exclude', true));
      document.getElementById(`deselect-all-tags-${category}-exclude-btn`).addEventListener('click', () => this._massUpdateTags(category, 'exclude', false));
    });
  }

  /**
   * Sets up the wizard by initializing UI elements, loading presets, and attaching event listeners.
   */
  setupWizard() {
    this.presetsSelect = document.getElementById('filter-presets-select');
    this.savePresetNameInput = document.getElementById('save-preset-name');
    this.savePresetBtn = document.getElementById('save-preset-btn');

    this._loadAndPopulatePresets();
    this._updateUIFromState();

    this._attachEventListeners();

    this.uiManager.addInfoIconToElement('filter-revision-mode-label', 'revisionMode');
    this.uiManager.addInfoIconToElement('region-filtering-label', 'regionFiltering');
    this.uiManager.addInfoIconToElement('language-filtering-label', 'languageFiltering');
    this.uiManager.addInfoIconToElement('other-filtering-label', 'otherFiltering');
    this.uiManager.addInfoIconToElement('region-include-label', 'includeTags');
    this.uiManager.addInfoIconToElement('region-exclude-label', 'excludeTags');
    this.uiManager.addInfoIconToElement('language-include-label', 'includeTags');
    this.uiManager.addInfoIconToElement('language-exclude-label', 'excludeTags');
    this.uiManager.addInfoIconToElement('other-include-label', 'includeTags');
    this.uiManager.addInfoIconToElement('other-exclude-label', 'excludeTags');
    this.uiManager.addInfoIconToElement('filter-dedupe-mode-label', 'dedupeMode');
    this.uiManager.addInfoIconToElement('priority-list-label', 'priorityList');
    this.uiManager.addInfoIconToElement('priority-available-label', 'availableTags');

    this.uiManager.searchManager.refreshSearchPlaceholders();
  }

  /**
   * Handles click events on tag checkboxes to update include/exclude state.
   * @param {Event} e - The click event object.
   * @private
   */
  _handleTagClick(e) {
    if (e.target.type !== 'checkbox') return;
    const listContainer = e.currentTarget;
    const category = listContainer.id.split('-')[3];
    const { name: tagName } = e.target.parentElement.dataset;
    const { tagType } = e.target.dataset;
    const { checked: isChecked } = e.target;

    const includeTags = new Set(stateService.get('includeTags')[category]);
    const excludeTags = new Set(stateService.get('excludeTags')[category]);

    if (tagType === 'include') {
      if (isChecked) includeTags.add(tagName);
      else includeTags.delete(tagName);
    } else {
      if (isChecked) excludeTags.add(tagName);
      else excludeTags.delete(tagName);
    }

    stateService.get('includeTags')[category] = Array.from(includeTags);
    stateService.get('excludeTags')[category] = Array.from(excludeTags);
    this._updateUIFromState();
  }

  /**
   * Selects or deselects all tags in a given category and type (include/exclude).
   * @param {string} category - The tag category (e.g., 'region').
   * @param {string} type - The type of tag list ('include' or 'exclude').
   * @param {boolean} shouldSelect - True to select all, false to deselect all.
   * @private
   */
  _massUpdateTags(category, type, shouldSelect) {
    const listEl = document.getElementById(`wizard-tags-list-${category}-${type}`);
    const includeTags = new Set(stateService.get('includeTags')[category]);
    const excludeTags = new Set(stateService.get('excludeTags')[category]);

    listEl.querySelectorAll('label:not(.hidden) input[type=checkbox]').forEach(checkbox => {
      const tagName = checkbox.parentElement.dataset.name;
      if (shouldSelect) {
        if (type === 'include' && !excludeTags.has(tagName)) includeTags.add(tagName);
        else if (type === 'exclude' && !includeTags.has(tagName)) excludeTags.add(tagName);
      } else {
        if (type === 'include') includeTags.delete(tagName);
        else excludeTags.delete(tagName);
      }
    });

    stateService.get('includeTags')[category] = Array.from(includeTags);
    stateService.get('excludeTags')[category] = Array.from(excludeTags);
    this._updateUIFromState();
  }

  /**
   * Populates the UI with tag checkboxes for a specific category.
   * @param {string} category - The category of tags to populate (e.g., 'region', 'language').
   * @param {Array<string>} allCategoryTags - All available tags for this category.
   * @param {Array<string>} currentIncludeTags - Tags currently set to be included.
   * @param {Array<string>} currentExcludeTags - Tags currently set to be excluded.
   */
  populateTagCategory(category, allCategoryTags, currentIncludeTags, currentExcludeTags) {
    const includeListEl = document.getElementById(`wizard-tags-list-${category}-include`);
    const excludeListEl = document.getElementById(`wizard-tags-list-${category}-exclude`);

    if (!includeListEl || !excludeListEl) return;

    includeListEl.innerHTML = '';
    excludeListEl.innerHTML = '';
    allCategoryTags.sort((a, b) => a.localeCompare(b));

    const renderTagItem = (tag, type) => {
      const isIncluded = currentIncludeTags.includes(tag);
      const isExcluded = currentExcludeTags.includes(tag);

      const el = document.createElement('label');
      el.className = 'flex items-center p-2 bg-neutral-900 rounded-md space-x-2 cursor-pointer border border-transparent hover:border-accent-500 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500 select-none';
      el.dataset.name = tag;
      el.tabIndex = 0;

      let checkboxHtml = `<input type="checkbox" class="h-4 w-4" data-tag-type="${type}"`;
      if ((type === 'include' && isIncluded) || (type === 'exclude' && isExcluded)) {
        checkboxHtml += ' checked';
      }
      if ((type === 'include' && isExcluded) || (type === 'exclude' && isIncluded)) {
        checkboxHtml += ' disabled';
        el.classList.add('opacity-50', 'cursor-not-allowed');
        el.style.pointerEvents = 'none';
      }
      checkboxHtml += '>';
      el.innerHTML = `${checkboxHtml}<span class="text-neutral-300">${tag}</span>`;
      return el;
    };

    allCategoryTags.forEach(tag => {
      includeListEl.appendChild(renderTagItem(tag, 'include'));
      excludeListEl.appendChild(renderTagItem(tag, 'exclude'));
    });
  }

  /**
   * Updates the placeholder message in the priority list if it's empty.
   */
  updatePriorityPlaceholder() {
    const priorityList = document.getElementById('priority-list');
    if (!priorityList) return;

    let noResultsEl = priorityList.querySelector('.no-results');
    const itemCount = priorityList.querySelectorAll('.list-group-item').length;

    if (itemCount === 0) {
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'no-results col-span-full text-center text-neutral-500';
        noResultsEl.textContent = 'No tags prioritised.';
        priorityList.appendChild(noResultsEl);
      }
    } else if (noResultsEl) {
      noResultsEl.remove();
    }
  }

  /**
   * Updates the list of available tags for the priority builder, excluding those already in the priority list.
   * Re-initializes the Sortable.js instances for the priority and available lists.
   */
  updatePriorityBuilderAvailableTags() {
    let availableTags = new Set();
    Object.values(stateService.get('includeTags')).forEach(tags => tags.forEach(tag => availableTags.add(tag)));
    availableTags = Array.from(availableTags).sort((a, b) => a.localeCompare(b));

    const priorityList = document.getElementById('priority-list');
    const priorityAvailable = document.getElementById('priority-available');
    const currentPriorityItems = Array.from(priorityList.children);
    const validPriorityTagsSet = new Set(currentPriorityItems.map(item => item.textContent));
    const tagsForAvailableList = availableTags.filter(tag => !validPriorityTagsSet.has(tag));

    priorityList.innerHTML = '';
    priorityAvailable.innerHTML = '';
    currentPriorityItems.forEach(item => priorityList.appendChild(item));
    tagsForAvailableList.forEach((tag, i) => {
      const el = document.createElement('div');
      el.className = 'list-group-item';
      el.textContent = tag;
      el.dataset.name = tag;
      el.dataset.id = `tag-priority-available-${i}`;
      el.tabIndex = 0;
      priorityAvailable.appendChild(el);
    });

    if (stateService.get('prioritySortable')) stateService.get('prioritySortable').destroy();
    if (stateService.get('availableSortable')) stateService.get('availableSortable').destroy();

    const searchInput = document.getElementById('search-priority-tags');
    if (searchInput) searchInput.dispatchEvent(new Event('input'));

    const onPriorityChange = () => {
      const updatedPriorityList = Array.from(priorityList.children)
        .filter(el => !el.classList.contains('no-results'))
        .map(el => el.textContent);
      stateService.set('priorityList', updatedPriorityList);
      this.updatePriorityPlaceholder();
    };

    stateService.set('availableSortable', new Sortable(priorityAvailable, {
      group: 'shared',
      animation: 150,
      sort: false,
      onAdd: onPriorityChange
    }));
    stateService.set('prioritySortable', new Sortable(priorityList, {
      group: 'shared',
      animation: 150,
      onAdd: onPriorityChange,
      onUpdate: onPriorityChange
    }));

    this.updatePriorityPlaceholder();
  }
}

export default WizardManager;