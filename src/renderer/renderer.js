/**
 * @file This file is the main entry point for the renderer process of the Electron application.
 * It handles the initialization of the UI, sets up event listeners for user interactions,
 * and coordinates with various services and managers to fetch data, manage state, and control application flow.
 */
import stateService from './StateService.js';
import appService from './services/AppService.js';
import windowService from './services/WindowService.js';
import myrientDataService from './services/MyrientDataService.js';
import downloadService from './services/DownloadService.js';
import shellService from './services/ShellService.js';
import filterService from './services/FilterService.js';
import UIManager from './ui/UIManager.js';
import DownloadUI from './ui/DownloadUI.js';
import SettingsManager from './managers/SettingsManager.js';
import PresetsManager from './managers/PresetsManager.js';


/**
 * The instance of DownloadUI, initialized after DOM content is loaded.
 * @type {DownloadUI}
 */
let downloadUI;

document.addEventListener('DOMContentLoaded', async () => {
  /**
   * Initializes the application once the DOM is fully loaded.
   * Sets up UI managers, loads initial data, and registers event listeners.
   */

  const presetsManager = new PresetsManager(document.getElementById('presets-content'), stateService);
  const uiManager = new UIManager(document.getElementById('view-container'), loadDirectory, presetsManager);
  presetsManager.setUIManager(uiManager);
  presetsManager.addEventListeners();
  await presetsManager.loadPresets();
  downloadUI = new DownloadUI(stateService, downloadService, uiManager);
  uiManager.setDownloadUI(downloadUI);
  await uiManager.viewManager.loadViews();

  const settingsManager = new SettingsManager(uiManager);
  settingsManager.setupSettings();

  /**
   * Loads directories from the Myrient service and populates the view.
   * @param {string} [url] - The URL to load directories from. If not provided, loads from the base URL.
   */
  async function loadDirectory(url) {
    uiManager.showLoading('Loading...');
    try {
      // Construct the full path from the directory stack
      const directoryStack = stateService.get('directoryStack') || [];
      const path = directoryStack.map(item => item.href).join('');
      const fullUrl = url ? new URL(path, stateService.get('baseUrl')).href : stateService.get('baseUrl');

      const content = await myrientDataService.loadDirectory(fullUrl);
      if (content.directories.length === 0 && directoryStack.length > 0) {
        stateService.set('downloadFromHere', false); // User drilled into a leaf directory
        handleDirectorySelect(directoryStack[directoryStack.length - 1]);
      } else {
        uiManager.showView('directories');
        uiManager.populateList('list-directories', content.directories, (item) => {
          stateService.set('downloadFromHere', false); // User is drilling down
          const currentStack = stateService.get('directoryStack') || [];
          stateService.setDirectoryStack([...currentStack, item]);
          const newPath = [...currentStack, item].map(i => i.href).join('');
          loadDirectory(newPath);
        });
        uiManager.populateFiles('list-files', content.files);

        const downloadBtn = document.getElementById('download-from-here-btn');
        if (directoryStack.length >= 1) {
          downloadBtn.classList.remove('hidden');
          downloadBtn.onclick = () => {
            stateService.set('downloadFromHere', true); // User chose to download from this level
            handleDirectorySelect(directoryStack[directoryStack.length - 1]);
          };
        } else {
          downloadBtn.classList.add('hidden');
        }
        uiManager.hideLoading();
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
      uiManager.hideLoading();
    }
  }

  /**
   * Handles the selection of a directory or archive, triggering file scraping and filtering.
   * Based on whether filterable tags are present, it either proceeds to results or shows a filtering wizard.
   * @async
   * @param {object} item The selected directory or archive item.
   * @returns {Promise<void>}
   */
  async function handleDirectorySelect(item) {
    // Unlike before, we don't reset the wizard state here based on item href,
    // as the directoryStack is the source of truth for navigation state.
    // Resetting should happen when navigating via breadcrumbs or back button.
    uiManager.showLoading('Scanning files...', 'Depending on how many files the directory contains this can take some time.');
    try {
      await myrientDataService.scrapeAndParseFiles();

      uiManager.hideLoading();
      const userWantsToFilter = await uiManager.showConfirmationModal(
        'Would you like to use the filtering wizard?',
        {
          title: 'Filtering Wizard',
          confirmText: 'Yes',
          cancelText: 'No'
        }
      );
      if (userWantsToFilter === true) {
        uiManager.showLoading('Preparing wizard...');
        uiManager.showView('wizard');
        stateService.set('wizardSkipped', false);
        await uiManager.wizardManager.setupWizard();
      } else if (userWantsToFilter === false) {
        uiManager.showLoading('Preparing results...');
        setTimeout(async () => {
          const defaultFilters = {
            include_tags: [],
            exclude_tags: [],
            include_strings: [],
            exclude_strings: [],
            rev_mode: 'all',
            dedupe_mode: 'all',
            priority_list: [],
          };
          await filterService.runFilter(defaultFilters);
          uiManager.showView('results');
          downloadUI.populateResults();
          stateService.set('wizardSkipped', true);
          uiManager.hideLoading();
        }, 0);
      } else { // Handles null (dismissed)
        const fromDownloadFromHere = stateService.get('downloadFromHere');
        if (fromDownloadFromHere) {
          stateService.set('downloadFromHere', false); // Reset flag
          uiManager.hideLoading();
          return; // Stay on the current directory view
        }

        const currentStack = stateService.get('directoryStack') || [];
        if (currentStack.length > 0) {
          const newStack = currentStack.slice(0, currentStack.length - 1);
          stateService.setDirectoryStack(newStack);
          stateService.resetWizardState();
          const url = newStack.length > 0 ? newStack.map(item => item.href).join('') : undefined;
          loadDirectory(url);
        }
      }
    } catch (e) {
      uiManager.hideLoading();
      alert(`Error: ${e.message}`);
      // Go back to the previous directory view on error
      const currentStack = stateService.get('directoryStack') || [];
      const url = currentStack.length > 0 ? currentStack.map(i => i.href).join('') : undefined;
      loadDirectory(url);
    }
  }

  document.getElementById('breadcrumbs').addEventListener('click', (e) => {
    if (stateService.get('isDownloading')) return;
    if (e.target.dataset.step !== undefined && e.target.classList.contains('cursor-pointer')) {
      const step = parseInt(e.target.dataset.step, 10);
      const currentStack = stateService.get('directoryStack') || [];
      const newStack = currentStack.slice(0, step);
      stateService.setDirectoryStack(newStack);
      stateService.resetWizardState();
      const url = newStack.length > 0 ? newStack.map(item => item.href).join('') : undefined;
      loadDirectory(url);
    }
  });

  document.getElementById('header-back-btn').addEventListener('click', () => {
    if (stateService.get('isDownloading')) return;

    const currentView = stateService.get('currentView');
    const directoryStack = stateService.get('directoryStack') || [];

    if (currentView === 'results' || currentView === 'wizard') {
      const fromDownloadFromHere = stateService.get('downloadFromHere');
      stateService.set('downloadFromHere', false); // Reset flag

      if (fromDownloadFromHere) {
        // SCENARIO B: Go back to the same directory view
        const url = directoryStack.map(item => item.href).join('');
        loadDirectory(url);
      } else {
        // SCENARIO A: Go up to the parent directory view
        const newStack = directoryStack.slice(0, directoryStack.length - 1);
        stateService.setDirectoryStack(newStack);
        stateService.resetWizardState();
        const url = newStack.length > 0 ? newStack.map(item => item.href).join('') : undefined;
        loadDirectory(url);
      }
    } else if (directoryStack.length > 0) {
      // Go up one level from a directory view
      const newStack = directoryStack.slice(0, directoryStack.length - 1);
      stateService.setDirectoryStack(newStack);
      stateService.resetWizardState();
      const url = newStack.length > 0 ? newStack.map(item => item.href).join('') : undefined;
      loadDirectory(url);
    }
  });

  document.getElementById('minimize-btn').addEventListener('click', () => {
    windowService.minimizeWindow();
  });
  document.getElementById('maximize-restore-btn').addEventListener('click', () => {
    windowService.maximizeRestoreWindow();
  });
  document.getElementById('close-btn').addEventListener('click', () => {
    windowService.closeWindow();
  });

  document.getElementById('github-link').addEventListener('click', () => {
    shellService.openExternal('https://github.com/bradrevans/myrient-downloader');
  });

  document.getElementById('kofi-link').addEventListener('click', () => {
    shellService.openExternal('https://ko-fi.com/bradrevans');
  });

  const presetsBtn = document.getElementById('presets-btn');
  const presetsPanel = document.getElementById('presets-panel');
  const presetsOverlay = document.getElementById('presets-overlay');
  const closePresetsBtn = document.getElementById('close-presets-btn');

  /**
   * Opens the presets side panel.
   */
  function openPresets() {
    presetsPanel.classList.remove('translate-x-full');
    presetsOverlay.classList.add('open');
    presetsBtn.classList.add('presets-open');
    settingsManager.closeSettings();
    presetsManager.loadPresets();
    presetsManager.renderPresets();
    presetsManager.initializePresetsTooltips();
  }

  /**
   * Closes the presets side panel.
   */
  function closePresets() {
    presetsPanel.classList.add('translate-x-full');
    presetsOverlay.classList.remove('open');
    presetsBtn.classList.remove('presets-open');
  }

  closePresetsBtn.addEventListener('click', closePresets);
  presetsOverlay.addEventListener('click', closePresets);

  document.getElementById('settings-btn').addEventListener('click', () => {
    if (settingsManager.settingsPanel.classList.contains('translate-x-full')) {
      settingsManager.openSettings();
      closePresets();
    } else {
      settingsManager.closeSettings();
    }
  });

  document.getElementById('presets-btn').addEventListener('click', () => {
    if (presetsPanel.classList.contains('translate-x-full')) {
      openPresets();
      settingsManager.closeSettings();
    } else {
      closePresets();
    }
  });

  document.getElementById('donate-link').addEventListener('click', () => {
    shellService.openExternal('https://myrient.erista.me/donate/');
  });

  /**
   * Sets the application version in the UI.
   * @async
   * @returns {Promise<void>}
   */
  async function setAppVersion() {
    const version = await appService.getAppVersion();
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = version;
    }
  }

  /**
   * Checks for application updates on startup and prompts the user if an update is available.
   * @async
   * @returns {Promise<void>}
   */
  async function checkForUpdatesOnStartup() {
    const result = await appService.checkForUpdates();
    if (result.isUpdateAvailable) {
      const updateStatusElement = document.getElementById('update-status');
      updateStatusElement.innerHTML = `Update available: <a href="#" id="release-link" class="text-accent-500 hover:underline">${result.latestVersion}</a>`;
      document.getElementById('release-link').addEventListener('click', (e) => {
        e.preventDefault();
        shellService.openExternal(result.releaseUrl);
      });

      const userChoseDownload = await uiManager.showConfirmationModal(
        `A new version (${result.latestVersion}) is available. Would you like to download it?`,
        {
          title: 'Update Available',
          confirmText: 'Download',
          cancelText: 'Ignore'
        }
      );
      if (userChoseDownload) {
        shellService.openExternal(result.releaseUrl);
      }
    }
  }

  loadDirectory();
  uiManager.breadcrumbManager.updateBreadcrumbs();
  setAppVersion();
  checkForUpdatesOnStartup();
});

