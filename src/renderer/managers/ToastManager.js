/**
 * Manages the display of toast notifications.
 * @class
 */
class ToastManager {
  /**
   * Creates an instance of ToastManager.
   */
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  /**
   * Displays a toast notification.
   * @param {string} message - The message to display in the toast.
   * @param {string} [type='success'] - The type of toast ('success', 'error', 'info').
   * @param {number} [duration=3000] - The duration in milliseconds to display the toast.
   */
  showToast(message, type = 'success', duration = 3000) {
    if (!this.container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} flex items-center justify-between`;

    const messageElement = document.createElement('span');
    messageElement.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    toast.appendChild(messageElement);
    toast.appendChild(closeButton);
    this.container.appendChild(toast);

    const toastBgColor = getComputedStyle(toast).backgroundColor;

    closeButton.innerHTML = `
      <svg class="toast-close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="white"/>
        <path d="M15 9L9 15" stroke="${toastBgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9L15 15" stroke="${toastBgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    const removeToast = () => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, { once: true });
    };

    const timeoutId = setTimeout(removeToast, duration);

    closeButton.addEventListener('click', () => {
      clearTimeout(timeoutId);
      removeToast();
    });
  }
}

export default new ToastManager();
