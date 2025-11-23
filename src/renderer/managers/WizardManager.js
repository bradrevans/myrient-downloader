import stateService from '../StateService.js';

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
  }

  /**
   * Sets up the wizard interface with event listeners and initial state for filters and tag management.
   * @memberof WizardManager
   */
  setupWizard() {
    const revisionToggle = document.getElementById('filter-revision-mode');
    if (!revisionToggle) { console.error('filter-revision-mode not found'); return; }
    const revisionOptions = revisionToggle.querySelectorAll('.toggle-option');
    const currentRevisionMode = stateService.get('revisionMode');

    revisionOptions.forEach(option => {
      if (option.dataset.value === currentRevisionMode) {
        option.classList.add('active');
      }
      option.addEventListener('click', () => {
        revisionOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const newMode = option.dataset.value;
        stateService.set('revisionMode', newMode);
      });
    });

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

    const allTags = stateService.get('allTags');
    const totalTagCount = Object.values(allTags).reduce((sum, tags) => sum + tags.length, 0);

    const wizardFileCount = document.getElementById('wizard-file-count');
    if (wizardFileCount) wizardFileCount.textContent = stateService.get('allFiles').length;
    const wizardTagCount = document.getElementById('wizard-tag-count');
    if (wizardTagCount) wizardTagCount.textContent = totalTagCount;

    this.populateTagCategory('region', allTags.Region || [], stateService.get('includeTags').region, stateService.get('excludeTags').region);
    this.populateTagCategory('language', allTags.Language || [], stateService.get('includeTags').language, stateService.get('excludeTags').language);
    this.populateTagCategory('other', allTags.Other || [], stateService.get('includeTags').other, stateService.get('excludeTags').other);

    const priorityListEl = document.getElementById('priority-list');
    if (priorityListEl) priorityListEl.innerHTML = '';
    const priorityAvailableEl = document.getElementById('priority-available');
    if (priorityAvailableEl) priorityAvailableEl.innerHTML = '';

    const currentPriorityList = stateService.get('priorityList');
    currentPriorityList.forEach(tag => {
      const el = document.createElement('div');
      el.className = 'list-group-item';
      el.textContent = tag;
      el.dataset.name = tag;
      if (priorityListEl) priorityListEl.appendChild(el);
    });

    this.updatePriorityBuilderAvailableTags();

    const dedupeToggle = document.getElementById('filter-dedupe-mode');
    if (!dedupeToggle) { console.error('filter-dedupe-mode not found'); return; }
    const dedupeOptions = dedupeToggle.querySelectorAll('.toggle-option');
    const currentDedupeMode = stateService.get('dedupeMode');

    dedupeOptions.forEach(option => {
      if (option.dataset.value === currentDedupeMode) {
        option.classList.add('active');
      }
      option.addEventListener('click', () => {
        dedupeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const newMode = option.dataset.value;
        stateService.set('dedupeMode', newMode);
        const priorityBuilderUi = document.getElementById('priority-builder-ui');
        if (priorityBuilderUi) priorityBuilderUi.classList.toggle('hidden', newMode !== 'priority');
      });
    });

    this.uiManager.addInfoIconToElement('filter-dedupe-mode-label', 'dedupeMode');
    this.uiManager.addInfoIconToElement('priority-list-label', 'priorityList');
    this.uiManager.addInfoIconToElement('priority-available-label', 'availableTags');

    const priorityBuilderUi = document.getElementById('priority-builder-ui');
    if (priorityBuilderUi) priorityBuilderUi.classList.toggle('hidden', currentDedupeMode !== 'priority');

    this.uiManager.searchManager.refreshSearchPlaceholders();
  }

  /**
   * Populates the UI with tags for a specific category, distinguishing between included and excluded tags.
   * @memberof WizardManager
   * @param {string} category The tag category (e.g., 'region', 'language', 'other').
   * @param {Array<string>} allCategoryTags All tags belonging to the specified category.
   * @param {Array<string>} currentIncludeTags Tags currently marked for inclusion in this category.
   * @param {Array<string>} currentExcludeTags Tags currently marked for exclusion in this category.
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
      if (type === 'include' && isIncluded) {
        checkboxHtml += ' checked';
      } else if (type === 'exclude' && isExcluded) {
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

    const handleTagClick = (e) => {
      if (e.target.type !== 'checkbox') return;

      const targetCheckbox = e.target;
      const tagName = targetCheckbox.parentElement.dataset.name;
      const tagType = targetCheckbox.dataset.tagType;
      const isChecked = targetCheckbox.checked;

      const includeTags = new Set(stateService.get('includeTags')[category]);
      const excludeTags = new Set(stateService.get('excludeTags')[category]);

      const opposingType = tagType === 'include' ? 'exclude' : 'include';
      const opposingListEl = document.getElementById(`wizard-tags-list-${category}-${opposingType}`);
      const opposingLabel = opposingListEl.querySelector(`[data-name="${tagName}"]`);
      const opposingCheckbox = opposingLabel?.querySelector('input');

      if (tagType === 'include') {
        if (isChecked) {
          includeTags.add(tagName);
          if (excludeTags.has(tagName)) {
            excludeTags.delete(tagName);
            if (opposingCheckbox) opposingCheckbox.checked = false;
          }
        } else {
          includeTags.delete(tagName);
        }
      } else {
        if (isChecked) {
          excludeTags.add(tagName);
          if (includeTags.has(tagName)) {
            includeTags.delete(tagName);
            if (opposingCheckbox) opposingCheckbox.checked = false;
          }
        } else {
          excludeTags.delete(tagName);
        }
      }

      stateService.get('includeTags')[category] = Array.from(includeTags);
      stateService.get('excludeTags')[category] = Array.from(excludeTags);

      if (opposingLabel && opposingCheckbox) {
        if (isChecked) {
          opposingCheckbox.disabled = true;
          opposingLabel.classList.add('opacity-50', 'cursor-not-allowed');
          opposingLabel.style.pointerEvents = 'none';
        } else {
          opposingCheckbox.disabled = false;
          opposingLabel.classList.remove('opacity-50', 'cursor-not-allowed');
          opposingLabel.style.pointerEvents = '';
        }
      }
      this.updatePriorityBuilderAvailableTags();
    };

    includeListEl.addEventListener('change', handleTagClick);
    excludeListEl.addEventListener('change', handleTagClick);

    const massUpdateTags = (type, shouldSelect) => {
      const listEl = document.getElementById(`wizard-tags-list-${category}-${type}`);
      const opposingType = type === 'include' ? 'exclude' : 'include';
      const opposingListEl = document.getElementById(`wizard-tags-list-${category}-${opposingType}`);

      const includeTags = new Set(stateService.get('includeTags')[category]);
      const excludeTags = new Set(stateService.get('excludeTags')[category]);

      listEl.querySelectorAll('label:not(.hidden) input[type=checkbox]').forEach(checkbox => {
        const tagName = checkbox.parentElement.dataset.name;
        const opposingLabel = opposingListEl.querySelector(`[data-name="${tagName}"]`);
        const opposingCheckbox = opposingLabel?.querySelector('input');

        if (shouldSelect) {
          if (type === 'include') {
            if (!excludeTags.has(tagName)) {
              includeTags.add(tagName);
              checkbox.checked = true;
            }
          } else {
            if (!includeTags.has(tagName)) {
              excludeTags.add(tagName);
              checkbox.checked = true;
            }
          }
        } else {
          checkbox.checked = false;
          if (type === 'include') {
            includeTags.delete(tagName);
          } else {
            excludeTags.delete(tagName);
          }
        }
        if (type === 'include' && includeTags.has(tagName) && excludeTags.has(tagName)) {
          excludeTags.delete(tagName);
          if (opposingCheckbox) opposingCheckbox.checked = false;
        } else if (type === 'exclude' && excludeTags.has(tagName) && includeTags.has(tagName)) {
          includeTags.delete(tagName);
          if (opposingCheckbox) opposingCheckbox.checked = false;
        }
      });
      listEl.querySelectorAll('label').forEach(label => {
        const tagName = label.dataset.name;
        const checkbox = label.querySelector('input');
        if ((type === 'include' && excludeTags.has(tagName)) || (type === 'exclude' && includeTags.has(tagName))) {
          checkbox.disabled = true;
          label.classList.add('opacity-50', 'cursor-not-allowed');
          label.style.pointerEvents = 'none';
        } else {
          checkbox.disabled = false;
          label.classList.remove('opacity-50', 'cursor-not-allowed');
          label.style.pointerEvents = '';
        }
      });
      opposingListEl.querySelectorAll('label').forEach(label => {
        const tagName = label.dataset.name;
        const checkbox = label.querySelector('input');
        if ((type === 'include' && includeTags.has(tagName)) || (type === 'exclude' && excludeTags.has(tagName))) {
          checkbox.disabled = true;
          label.classList.add('opacity-50', 'cursor-not-allowed');
          label.style.pointerEvents = 'none';
        } else {
          checkbox.disabled = false;
          label.classList.remove('opacity-50', 'cursor-not-allowed');
          label.style.pointerEvents = '';
        }
      });

      stateService.get('includeTags')[category] = Array.from(includeTags);
      stateService.get('excludeTags')[category] = Array.from(excludeTags);
      this.updatePriorityBuilderAvailableTags();
    };

    document.getElementById(`select-all-tags-${category}-include-btn`).addEventListener('click', () => massUpdateTags('include', true));
    document.getElementById(`deselect-all-tags-${category}-include-btn`).addEventListener('click', () => massUpdateTags('include', false));
    document.getElementById(`select-all-tags-${category}-exclude-btn`).addEventListener('click', () => massUpdateTags('exclude', true));
    document.getElementById(`deselect-all-tags-${category}-exclude-btn`).addEventListener('click', () => massUpdateTags('exclude', false));
  }

  /**
   * Updates the placeholder message for the priority list based on whether it contains items or not.
   * @memberof WizardManager
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
   * Updates the list of available tags for the priority builder, excluding tags already in the priority list.
   * @memberof WizardManager
   */
  updatePriorityBuilderAvailableTags() {
    let availableTags = new Set();
    const includeTags = stateService.get('includeTags');

    Object.values(includeTags).forEach(tags => {
      tags.forEach(tag => availableTags.add(tag));
    });

    availableTags = Array.from(availableTags);
    availableTags.sort((a, b) => a.localeCompare(b));

    const priorityList = document.getElementById('priority-list');
    const priorityAvailable = document.getElementById('priority-available');

    const currentPriorityItems = Array.from(priorityList.children);

    const validPriorityTagsSet = new Set(
      currentPriorityItems.map(item => item.textContent)
    );

    const tagsForAvailableList = availableTags.filter(tag =>
      !validPriorityTagsSet.has(tag)
    );

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
    if (searchInput) {
      searchInput.dispatchEvent(new Event('input'));
    }

    stateService.set('availableSortable', new Sortable(priorityAvailable, {
      group: 'shared',
      animation: 150,
      sort: false,
      onAdd: (evt) => {
        const allItems = Array.from(priorityAvailable.children);
        allItems.sort((a, b) => a.textContent.localeCompare(b.textContent));
        allItems.forEach(item => priorityAvailable.appendChild(item));
        const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
        stateService.set('priorityList', updatedPriorityList);
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      },
      onUpdate: () => {
        const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
        stateService.set('priorityList', updatedPriorityList);
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      },
      onEnd: () => {
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      }
    }));

    stateService.set('prioritySortable', new Sortable(priorityList, {
      group: 'shared',
      animation: 150,
      onAdd: () => {
        const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
        stateService.set('priorityList', updatedPriorityList);
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      },
      onUpdate: () => {
        const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
        stateService.set('priorityList', updatedPriorityList);
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      },
      onEnd: () => {
        this.updatePriorityPlaceholder();
        this.updatePriorityBuilderAvailableTags();
      }
    }));

    this.updatePriorityPlaceholder();
  }

  /**
   * Moves a specified tag from the available tags list to the priority list.
   * @memberof WizardManager
   * @param {string} tagName The name of the tag to move.
   */
  moveTagToPriorityList(tagName) {
    const priorityList = document.getElementById('priority-list');
    const priorityAvailable = document.getElementById('priority-available');
    const itemToMove = priorityAvailable.querySelector(`[data-name="${tagName}"]`);

    if (itemToMove && priorityList) {
      priorityList.appendChild(itemToMove);
      const updatedPriorityList = Array.from(priorityList.children).map(el => el.textContent);
      stateService.set('priorityList', updatedPriorityList);
      this.updatePriorityPlaceholder();
      this.updatePriorityBuilderAvailableTags();
    }
  }

  /**
   * Resets the priority list, moving all prioritized tags back to the available tags list.
   * @memberof WizardManager
   */
  resetPriorityList() {
    const priorityListEl = document.getElementById('priority-list');
    const priorityAvailableEl = document.getElementById('priority-available');

    if (!priorityListEl || !priorityAvailableEl) return;

    Array.from(priorityListEl.children).forEach(item => {
      item.tabIndex = 0;
      priorityAvailableEl.appendChild(item);
    });

    stateService.set('priorityList', []);

    const allItems = Array.from(priorityAvailableEl.children);
    allItems.sort((a, b) => a.textContent.localeCompare(b.textContent));
    allItems.forEach(item => priorityAvailableEl.appendChild(item));

    this.updatePriorityBuilderAvailableTags();
    this.updatePriorityPlaceholder();
  }
}

export default WizardManager;