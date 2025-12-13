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
import ModalManager from './managers/ModalManager.js';

let downloadUI;
let presetsManager;
let uiManager;
let consecutiveErrorCount = 0; // Initialize consecutive error count for directory loading

document.addEventListener('DOMContentLoaded', async () => {
  /**
   * Initializes the application once the DOM is fully loaded.
   * Sets up UI managers, loads initial data, and registers event listeners.
   */

  presetsManager = new PresetsManager(document.getElementById('presets-content'), stateService);
  uiManager = new UIManager(document.getElementById('view-container'), loadDirectory, presetsManager);
  presetsManager.setUIManager(uiManager);
  presetsManager.addEventListeners();
  await presetsManager.loadPresets();
  presetsManager.renderPresets();
  presetsManager.initializePresetsTooltips();
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
      stateService.set('consecutiveLoadFailures', 0); // Reset on success
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
        consecutiveErrorCount = 0; // Reset consecutive error count on success
      }
    } catch (e) {
      consecutiveErrorCount++; // Increment error count on failure
      uiManager.hideLoading(); // Hide loading indicator in any case

      let modalTitle = 'Failed to Load Directory';
      let modalText = 'The directory listing failed to load. Please ensure you have an active internet connection and try again.';

      // Determine modal options based on consecutive error count
      const modalOptions = {
        title: modalTitle,
        confirmText: 'Retry',
        cancelText: null, // Default to no cancel button
        dismissOnOverlayClick: false // Prevent closing on overlay click
      };

      if (consecutiveErrorCount >= 3) {
        modalText += '<br><br>If you continue to see this error, you could be getting blocked by your firwall, router or internet service provider. Please try using a desktop VPN to resolve the issue.';
        modalOptions.cancelText = 'Close App';
        modalOptions.cancelClass = 'btn-danger';
      }

      // Show the modal and handle the promise result
      const confirmed = await uiManager.showConfirmationModal(modalText, modalOptions);

      if (confirmed) {
        // 'Retry' was clicked
        // Add a small delay to allow the modal to visually close before retrying
        setTimeout(() => {
          loadDirectory(url); // Pass the original 'url' argument for retry
        }, 300);
      } else if (confirmed === false && consecutiveErrorCount >= 2) {
        // 'Close App' was clicked
        windowService.closeWindow();
      }
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
        // If the wizard is dismissed, the directoryStack is "ahead" of the displayed content.
        // We need to revert the directoryStack to its previous state.
        const currentStack = stateService.get('directoryStack') || [];
        if (currentStack.length > 0) {
          const newStack = currentStack.slice(0, currentStack.length - 1);
          stateService.setDirectoryStack(newStack);
          uiManager.breadcrumbManager.updateBreadcrumbs(); // Refresh breadcrumbs to reflect the reverted stack
        }
        uiManager.hideLoading();
        return;
      }
    } catch (e) {
      const currentFailures = stateService.get('consecutiveLoadFailures');
      stateService.set('consecutiveLoadFailures', currentFailures + 1);

      let modalTitle = 'Failed to Process Directory';
      let modalMessage = `An error occurred while processing the directory: ${e.message}. Please try again.`;
      let modalConfirmText = 'Retry';
      let modalCancelText = null;
      let modalConfirmClass = 'btn-success';

      if (stateService.get('consecutiveLoadFailures') >= 2) {
        modalMessage += '\n\nIf this error persists, there might be an issue with the directory\'s content or Myrient\'s service availability. Consider trying a different directory or checking your network connection.';
        modalCancelText = 'Close App';
      }

      const confirmed = await uiManager.showConfirmationModal(modalMessage, {
        title: modalTitle,
        confirmText: modalConfirmText,
        cancelText: modalCancelText,
        confirmClass: modalConfirmClass,
        dismissOnOverlayClick: false // Prevent closing on overlay click
      });

      if (confirmed) {
        // User clicked Retry
        loadDirectory(url);
      } else if (confirmed === false && stateService.get('consecutiveLoadFailures') >= 2) {
        // User clicked Close App after multiple failures
        windowService.closeWindow();
      } else {
        // User clicked cancel on first error or dismissed modal
        // Navigate back to the previous directory without re-attempting loadDirectory
        const currentStack = stateService.get('directoryStack') || [];
        const newStack = currentStack.slice(0, currentStack.length - 1);
        stateService.setDirectoryStack(newStack);
        stateService.resetWizardState();
        const prevUrl = newStack.length > 0 ? newStack.map(item => item.href).join('') : undefined;
        // Do NOT call loadDirectory(prevUrl) here. The UI will update to the previous breadcrumbs.
      }
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

