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

  const uiManager = new UIManager(document.getElementById('view-container'), loadArchives);
  downloadUI = new DownloadUI(stateService, downloadService, uiManager);
  uiManager.setDownloadUI(downloadUI);
  await uiManager.viewManager.loadViews();
  new SettingsManager();

  /**
   * Loads the main archives from the Myrient service and populates the archives view.
   * @async
   * @returns {Promise<void>}
   */
  async function loadArchives() {
    uiManager.showLoading('Loading Archives...');
    try {
      const archives = await myrientDataService.loadArchives();
      uiManager.showView('archives');
      uiManager.populateList('list-archives', archives, (item) => {
        stateService.set('archive', item);
        loadDirectories();
      });
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      uiManager.hideLoading();
    }
  }

  /**
   * Loads the directory list for the currently selected archive and populates the directories view.
   * If the directory is empty, it directly calls handleDirectorySelect with the current archive.
   * @async
   * @returns {Promise<void>}
   */
  async function loadDirectories() {
    uiManager.showLoading('Loading Directories...');
    try {
      const directories = await myrientDataService.loadDirectories();
      if (directories.length === 0) {
        const currentArchive = stateService.get('archive');
        handleDirectorySelect(currentArchive);
      } else {
        uiManager.showView('directories');
        uiManager.populateList('list-directories', directories, (item) => {
          handleDirectorySelect(item);
        });
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
    stateService.set('directory', item);
    stateService.resetWizardState();
    uiManager.showLoading('Scanning files...');
    try {
      const { hasSubdirectories } = await myrientDataService.scrapeAndParseFiles();

      if (hasSubdirectories) {
        const defaultFilters = {
          include_tags: [],
          exclude_tags: [],
          rev_mode: 'all',
          dedupe_mode: 'all',
          priority_list: [],
        };
        await filterService.runFilter(defaultFilters);
        uiManager.showView('results');
        downloadUI.populateResults(hasSubdirectories);
        stateService.set('wizardSkipped', true);
        return;
      }

      const allTags = stateService.get('allTags');
      const hasNoTags = Object.keys(allTags).length === 0 || Object.values(allTags).every(arr => arr.length === 0);

      if (hasNoTags) {
        const defaultFilters = {
          include_tags: [],
          exclude_tags: [],
          rev_mode: 'all',
          dedupe_mode: 'all',
          priority_list: [],
        };
        await filterService.runFilter(defaultFilters);
        uiManager.showView('results');
        downloadUI.populateResults(hasSubdirectories);
        stateService.set('wizardSkipped', true);
      } else {
        uiManager.hideLoading();
        const userWantsToFilter = await uiManager.showConfirmationModal(
          'This directory contains filterable tags. Would you like to use the filtering wizard?',
          {
            title: 'Filtering Wizard',
            confirmText: 'Yes',
            cancelText: 'No'
          }
        );
        if (userWantsToFilter === true) {
          uiManager.showView('wizard');
          stateService.set('wizardSkipped', false);
          uiManager.wizardManager.setupWizard();
        } else if (userWantsToFilter === false) {
          uiManager.showLoading('Filtering files...');
          const defaultFilters = {
            include_tags: [],
            exclude_tags: [],
            rev_mode: 'all',
            dedupe_mode: 'all',
            priority_list: [],
          };
          await filterService.runFilter(defaultFilters);
          uiManager.showView('results');
          downloadUI.populateResults(hasSubdirectories);
          stateService.set('wizardSkipped', true);
        }
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
      uiManager.showView('directories');
    } finally {
      uiManager.hideLoading();
    }
  }

  document.getElementById('breadcrumbs').addEventListener('click', (e) => {
    if (stateService.get('isDownloading')) return;
    if (e.target.dataset.view) {
      const view = e.target.dataset.view;
      const step = parseInt(e.target.dataset.step, 10);
      if (step === 0) {
        stateService.set('archive', { name: '', href: '' });
        stateService.set('directory', { name: '', href: '' });
        stateService.resetWizardState();
        loadArchives();
      }
      if (step === 1) {
        stateService.set('directory', { name: '', href: '' });
        stateService.resetWizardState();
        loadDirectories();
      }
    }
  });

  /**
   * Navigates back to either the directory list or the archive list based on the current state.
   */
  function goBackToDirectoryOrArchiveList() {
    const archiveHref = stateService.get('archive').href;
    const directoryHref = stateService.get('directory').href;

    if (archiveHref === directoryHref) {
      stateService.set('archive', { name: '', href: '' });
      stateService.set('directory', { name: '', href: '' });
      stateService.resetWizardState();
      loadArchives();
    } else {
      stateService.set('directory', { name: '', href: '' });
      stateService.resetWizardState();
      loadDirectories();
    }
  }

  document.getElementById('header-back-btn').addEventListener('click', () => {
    if (stateService.get('isDownloading')) return;
    if (stateService.get('currentView') === 'results') {
      if (stateService.get('wizardSkipped')) {
        goBackToDirectoryOrArchiveList();
      } else {
        uiManager.showView('wizard');
        uiManager.wizardManager.setupWizard();
      }
    } else if (stateService.get('currentView') === 'wizard') {
      goBackToDirectoryOrArchiveList();
    } else if (stateService.get('currentView') === 'directories') {
      stateService.set('archive', { name: '', href: '' });
      stateService.set('directory', { name: '', href: '' });
      stateService.resetWizardState();
      loadArchives();
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

  loadArchives();
  uiManager.breadcrumbManager.updateBreadcrumbs();
  setAppVersion();
  checkForUpdatesOnStartup();
});

