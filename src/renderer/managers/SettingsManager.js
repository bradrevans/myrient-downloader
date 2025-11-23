import appService from '../services/AppService.js';
import windowService from '../services/WindowService.js';
import shellService from '../services/ShellService.js';

/**
 * Manages the settings panel, including opening/closing and handling user interactions with settings options.
 * @class
 * @property {HTMLElement} settingsBtn The HTML element for the settings button.
 * @property {HTMLElement} settingsPanel The HTML element for the settings panel.
 * @property {HTMLElement} settingsOverlay The HTML element for the settings overlay.
 * @property {HTMLElement} closeSettingsBtn The HTML element for the close settings button.
 */
class SettingsManager {
    /**
     * Creates an instance of SettingsManager.
     * Initializes references to settings panel DOM elements and sets up event listeners.
     */
    constructor() {
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsOverlay = document.getElementById('settings-overlay');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for settings-related UI elements, such as zoom controls and update checks.
     * @memberof SettingsManager
     */
    setupEventListeners() {
        this.settingsBtn.addEventListener('click', () => {
            if (this.settingsPanel.classList.contains('translate-x-full')) {
                this.openSettings();
            } else {
                this.closeSettings();
            }
        });

        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.settingsOverlay.addEventListener('click', () => this.closeSettings());

        document.getElementById('zoom-in-btn').addEventListener('click', async () => {
            let zoomFactor = await windowService.getZoomFactor();
            let newZoomPercentage = Math.round(zoomFactor * 100) + 10;
            newZoomPercentage = Math.max(10, Math.min(400, newZoomPercentage));
            windowService.setZoomFactor(newZoomPercentage / 100);
            setTimeout(() => this.updateZoomDisplay(), 100);
        });

        document.getElementById('zoom-out-btn').addEventListener('click', async () => {
            let zoomFactor = await windowService.getZoomFactor();
            let newZoomPercentage = Math.round(zoomFactor * 100) - 10;
            newZoomPercentage = Math.max(10, Math.min(400, newZoomPercentage));
            windowService.setZoomFactor(newZoomPercentage / 100);
            setTimeout(() => this.updateZoomDisplay(), 100);
        });

        document.getElementById('zoom-level-display').addEventListener('change', (e) => {
            let newZoomPercentage = parseInt(e.target.value, 10);
            if (isNaN(newZoomPercentage)) newZoomPercentage = 100;
            newZoomPercentage = Math.max(10, Math.min(400, newZoomPercentage));
            const newZoomFactor = newZoomPercentage / 100;
            windowService.setZoomFactor(newZoomFactor);
            this.updateZoomDisplay();
        });

        document.getElementById('zoom-reset-btn').addEventListener('click', () => {
            windowService.zoomReset();
            setTimeout(() => this.updateZoomDisplay(), 100);
        });

        document.getElementById('check-for-updates-btn').addEventListener('click', async () => {
            const updateStatusElement = document.getElementById('update-status');
            updateStatusElement.textContent = 'Checking for updates...';
            const result = await appService.checkForUpdates();
            if (result.error) {
                updateStatusElement.textContent = result.error;
            } else if (result.isUpdateAvailable) {
                updateStatusElement.innerHTML = `Update available: <a href="#" id="release-link" class="text-accent-500 hover:underline">${result.latestVersion}</a>`;
                document.getElementById('release-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    shellService.openExternal(result.releaseUrl);
                });
            } else {
                updateStatusElement.textContent = 'You are on the latest version.';
            }
        });
    }

    /**
     * Opens the settings panel.
     * @memberof SettingsManager
     */
    openSettings() {
        this.settingsPanel.classList.remove('translate-x-full');
        this.settingsOverlay.classList.add('open');
        this.settingsBtn.classList.add('settings-open');
    }

    /**
     * Closes the settings panel.
     * @memberof SettingsManager
     */
    closeSettings() {
        this.settingsPanel.classList.add('translate-x-full');
        this.settingsOverlay.classList.remove('open');
        this.settingsBtn.classList.remove('settings-open');
    }

    /**
     * Updates the displayed zoom level in the settings panel.
     * @memberof SettingsManager
     */
    async updateZoomDisplay() {
        const zoomFactor = await windowService.getZoomFactor();
        const zoomPercentage = Math.round(zoomFactor * 100);
        document.getElementById('zoom-level-display').value = zoomPercentage;
    }
}

export default SettingsManager;
