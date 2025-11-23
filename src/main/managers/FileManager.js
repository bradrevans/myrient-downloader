import fs from 'fs';

/**
 * Manages basic file system operations such as deleting and reading files.
 * It provides an interface for interacting with the file system, handling common operations and errors.
 * @class
 */
class FileManager {
    /**
     * Deletes a file from the file system.
     * @memberof FileManager
     * @param {string} filePath The path to the file to be deleted.
     * @returns {Promise<{success: boolean, error?: string}>} A promise that resolves with an object indicating
     * the success of the operation and an error message if it fails.
     */
    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return { success: true };
            }
            return { success: false, error: 'File not found.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Reads the content of a file from the file system.
     * @memberof FileManager
     * @param {string} filePath The path to the file to be read.
     * @returns {Promise<{data: string, error?: string}>} A promise that resolves with an object containing
     * the file content (data) or an error message if the operation fails.
     */
    async readFile(filePath) {
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            return { data: fileContent };
        } catch (e) {
            return { error: e.message };
        }
    }
}

export default FileManager;
