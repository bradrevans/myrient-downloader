import { MYRIENT_BASE_URL } from '../shared/constants/appConstants.js';
import { parseSize } from '../shared/utils/formatters.js';

/**
 * Manages the application's state, providing methods to get and set state properties.
 * @class
 * @property {object} state The current state of the application.
 * @property {string} state.currentView The currently active view ('archives', 'directories', 'wizard', 'results').
 * @property {string} state.baseUrl The base URL for Myrient.
 * @property {{name: string, href: string}} state.archive The currently selected archive.
 * @property {{name: string, href: string}} state.directory The currently selected directory.
 * @property {Array<object>} state.allFiles All files found after scraping.
 * @property {Array<object>} state.finalFileList The list of files after filtering.
 * @property {Array<object>} state.selectedFilesForDownload The list of files selected for download.
 * @property {number} state.totalSelectedDownloadSize The total size of all selected files for download.
 * @property {string|null} state.downloadDirectory The chosen download directory path.
 * @property {object|null} state.prioritySortable Sortable.js instance for priority list.
 * @property {object|null} state.availableSortable Sortable.js instance for available tags list.
 * @property {boolean} state.isDownloading Flag indicating if a download is in progress.
 * @property {number} state.downloadStartTime Timestamp of when the current download started.
 * @property {number} state.totalBytesDownloadedThisSession Total bytes downloaded in the current session.
 * @property {object} state.includeTags Tags to include, categorized by region, language, other.
 * @property {Array<string>} state.includeTags.region Region tags to include.
 * @property {Array<string>} state.includeTags.language Language tags to include.
 * @property {Array<string>} state.includeTags.other Other tags to include.
 * @property {object} state.excludeTags Tags to exclude, categorized by region, language, other.
 * @property {Array<string>} state.excludeTags.region Region tags to exclude.
 * @property {Array<string>} state.excludeTags.language Language tags to exclude.
 * @property {Array<string>} state.excludeTags.other Other tags to exclude.
 * @property {Array<string>} state.priorityList Ordered list of tags for deduplication priority.
 * @property {string} state.revisionMode Current revision filtering mode ('all', 'highest').
 * @property {string} state.dedupeMode Current deduplication mode ('all', 'priority').
 * @property {boolean} state.createSubfolder Whether to create a subfolder for downloads.
 * @property {boolean} state.extractAndDelete Whether to extract archives and delete originals.
 * @property {boolean} state.extractPreviouslyDownloaded Whether to extract previously downloaded archives.
 * @property {boolean} state.wizardSkipped Whether the filtering wizard was skipped.
 * @property {boolean} state.isThrottlingEnabled Whether download throttling is enabled.
 * @property {number} state.throttleSpeed The speed for download throttling.
 * @property {string} state.throttleUnit The unit for download throttling speed.
 * @property {Array<object>} state.savedFilters The list of saved filter presets.
 */
class StateService {
  /**
   * Creates an instance of StateService and initializes the default state.
   */
  constructor() {
    this._listeners = {};
    this.state = {
      currentView: 'archives',
      baseUrl: MYRIENT_BASE_URL,
      archive: { name: '', href: '' },
      directory: { name: '', href: '' },
      allFiles: [],
      finalFileList: [],
      selectedFilesForDownload: [],
      totalSelectedDownloadSize: 0,
      downloadDirectory: null,
      prioritySortable: null,
      availableSortable: null,
      isDownloading: false,
      downloadStartTime: 0,
      totalBytesDownloadedThisSession: 0,
      includeTags: {
        region: [],
        language: [],
        other: [],
      },
      excludeTags: {
        region: [],
        language: [],
        other: [],
      },
      priorityList: [],
      revisionMode: 'highest',
      dedupeMode: 'priority',
      createSubfolder: false,
      extractAndDelete: false,
      extractPreviouslyDownloaded: false,
      wizardSkipped: false,
      isThrottlingEnabled: false,
      throttleSpeed: 100,
      throttleUnit: 'KB/s',
      savedFilters: [],
    };
  }

  /**
   * Subscribes a callback function to changes in a specific state property.
   * @param {string} key The state property to listen for changes on.
   * @param {function(any): void} callback The function to call when the state property changes.
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);
  }

  /**
   * Notifies all subscribers of a specific state property that its value has changed.
   * @param {string} key The state property that has changed.
   * @param {any} newValue The new value of the state property.
   */
  notify(key, newValue) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => callback(newValue));
    }
  }

  /**
   * Resets the state related to the wizard filtering process.
   * @memberof StateService
   */
  resetWizardState() {
    this.state.finalFileList = [];
    this.state.selectedFilesForDownload = [];
    this.state.includeTags = {
      region: [],
      language: [],
      other: [],
    };
    this.state.excludeTags = {
      region: [],
      language: [],
      other: [],
    };
    this.state.priorityList = [];
    this.state.revisionMode = 'highest';
    this.state.dedupeMode = 'priority';
    this.state.createSubfolder = false;
    this.state.extractAndDelete = false;
    this.state.extractPreviouslyDownloaded = false;
    this.state.isThrottlingEnabled = false;
    this.state.throttleSpeed = 100;
    this.state.throttleUnit = 'KB/s';
  }

  /**
   * Retrieves the value of a specified state property.
   * @memberof StateService
   * @param {string} key The key of the state property to retrieve.
   * @returns {*} The value of the state property.
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Sets the value of a specified state property.
   * @memberof StateService
   * @param {string} key The key of the state property to set.
   * @param {*} value The new value for the state property.
   */
  set(key, value) {
    this.state[key] = value;
    this.notify(key, value);
  }
}

const stateService = new StateService();
export default stateService;
