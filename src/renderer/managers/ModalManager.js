import KeyboardNavigator from '../ui/KeyboardNavigator.js';

/**
 * Manages the display and interaction of a confirmation modal.
 * @class
 * @property {HTMLElement} modal The main modal HTML element.
 * @property {HTMLElement} modalTitle The HTML element for the modal's title.
 * @property {HTMLElement} modalMessage The HTML element for the modal's message.
 * @property {HTMLElement} continueBtn The HTML element for the continue button.
 * @property {HTMLElement} cancelBtn The HTML element for the cancel button.
 * @property {HTMLElement} settingsButton The HTML element for the settings button.
 * @property {HTMLElement} modalContent The HTML element for the modal's content, which applies transitions.
 */
class ModalManager {
    /**
     * Creates an instance of ModalManager.
     * Initializes references to the modal's DOM elements.
     */
    constructor() {
        this.modal = document.getElementById('confirmation-modal');
        this.modalTitle = document.getElementById('confirmation-modal-title');
        this.modalMessage = document.getElementById('confirmation-modal-message');
        this.continueBtn = document.getElementById('confirmation-modal-continue');
        this.cancelBtn = document.getElementById('confirmation-modal-cancel');
        this.settingsButton = document.getElementById('settings-btn');
        this.modalContent = this.modal.querySelector('.modal-transition');
    }

    /**
     * Displays a confirmation modal with a given message and options.
     * @memberof ModalManager
     * @param {string} message The message to display in the modal.
     * @param {object} [options={}] Optional settings for the modal.
     * @param {string} [options.title='Confirmation'] The title of the modal.
     * @param {string} [options.confirmText='Continue'] The text for the confirm button.
     * @param {string|null} [options.cancelText='Cancel'] The text for the cancel button, or null to hide it.
     * @returns {Promise<boolean|null>} A promise that resolves to true if confirmed, false if cancelled, or null if dismissed (e.g., by clicking outside).
     */
    async showConfirmationModal(message, options = {}) {
        const {
            title = 'Confirmation',
            confirmText = 'Continue',
            cancelText = 'Cancel'
        } = options;

        if (this.settingsButton) {
            this.settingsButton.disabled = true;
        }

        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.continueBtn.textContent = confirmText;
        if (cancelText === null) {
            this.cancelBtn.classList.add('hidden');
        } else {
            this.cancelBtn.textContent = cancelText;
            this.cancelBtn.classList.remove('hidden');
        }

        this.modal.classList.add('open');
        if (this.modalContent) {
            this.modalContent.classList.add('open');
        }

        setTimeout(() => {
            this.continueBtn.focus();
        }, 50);

        return new Promise(resolve => {
            const modalButtons = [this.cancelBtn, this.continueBtn].filter(btn => !btn.classList.contains('hidden'));
            const modalKeyboardNavigator = new KeyboardNavigator([], '', null, this, modalButtons);

            const cleanup = (result) => {
                this.modal.classList.remove('open');
                if (this.modalContent) {
                    this.modalContent.classList.remove('open');
                }
                if (this.settingsButton) {
                    this.settingsButton.disabled = false;
                }
                this.continueBtn.removeEventListener('click', handleContinue);
                this.cancelBtn.removeEventListener('click', handleCancel);
                this.modal.removeEventListener('click', handleOverlayClick);
                this.modal.removeEventListener('keydown', modalKeyboardNavigator.handleModalKeyDown.bind(modalKeyboardNavigator));
                resolve(result);
            };

            const handleContinue = () => cleanup(true);
            const handleCancel = () => cleanup(false);

            const handleOverlayClick = (event) => {
                if (event.target === this.modal) {
                    cleanup(null);
                }
            };

            this.continueBtn.addEventListener('click', handleContinue);
            this.cancelBtn.addEventListener('click', handleCancel);
            this.modal.addEventListener('click', handleOverlayClick);
            this.modal.addEventListener('keydown', modalKeyboardNavigator.handleModalKeyDown.bind(modalKeyboardNavigator));
        });
    }
}

export default ModalManager;
