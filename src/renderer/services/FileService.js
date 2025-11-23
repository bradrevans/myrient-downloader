/**
 * Service for file-related actions.
 * @class
 */
class FileService {
  /**
   * Sends a request to the main process to delete a file.
   * @memberof FileService
   * @param {string} filePath The path of the file to delete.
   * @returns {Promise<object>} A promise that resolves with the result of the delete operation.
   */
  deleteFile(filePath) {
    return window.electronAPI.deleteFile(filePath);
  }
}

const fileService = new FileService();
export default fileService;
