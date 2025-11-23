import path from 'path';

/**
 * Service responsible for parsing filenames and extracting relevant information such as base name,
 * tags, and revision numbers. It also categorizes tags for easier filtering and organization.
 * @class
 */
class FileParserService {
  /**
   * Parses a given filename to extract its base name, tags, and revision.
   * @memberof FileParserService
   * @param {string} filename The full filename to parse (e.g., "Game Name (USA) (Rev 1).zip").
   * @returns {{name_raw: string, base_name: string, tags: Array<string>, categorizedTags: object, revision: number}} An object containing the parsed information.
   *   - `name_raw`: The original full filename.
   *   - `base_name`: The extracted base name of the file (e.g., "Game Name").
   *   - `tags`: An array of all tags found in the filename (e.g., ["USA", "Rev 1"]).
   *   - `categorizedTags`: An object where keys are tag categories (e.g., "Region", "Language", "Other") and values are arrays of tags belonging to that category.
   *   - `revision`: A numeric representation of the file's revision, where higher numbers indicate newer versions.
   *                 Positive numbers for releases, negative for pre-releases (e.g., beta, alpha, proto).
   */
  parseFilename(filename) {
    const nameNoExt = path.parse(filename).name;
    const baseNameMatch = nameNoExt.split(/\s*\(|\[/, 1);
    const baseName = baseNameMatch[0].trim();

    const tags = new Set();
    const tagRegex = /[\[(](.*?)[\])]/g;
    let match;
    while ((match = tagRegex.exec(nameNoExt)) !== null) {
      tags.add(match[1].trim());
    }

    const revision = this._parseRevision(nameNoExt);

    const categorizedTags = {};
    for (const tag of tags) {
      const category = this.categorizeTag(tag);
      if (!categorizedTags[category]) {
        categorizedTags[category] = [];
      }
      categorizedTags[category].push(tag);
    }

    return {
      name_raw: filename,
      base_name: baseName,
      tags: Array.from(tags),
      categorizedTags: categorizedTags,
      revision: revision,
    };
  }

  /**
   * Parses the revision from a filename without its extension.
   * The revision is parsed in a specific order of priority:
   * 1. Numbered releases (e.g., v1.2.3, Rev 2) - returns positive numbers (e.g., 1.002003, 2)
   * 2. Numbered Beta releases (e.g., Beta 2) - returns negative numbers from -1 to -0.01 (e.g., -0.98)
   * 3. Simple Beta releases (e.g., Beta) - returns -2
   * 4. Numbered Alpha releases (e.g., Alpha 1) - returns negative numbers from -3 to -2.01 (e.g., -2.99)
   * 5. Simple Alpha releases (e.g., Alpha) - returns -4
   * 6. Prototypes with a date (e.g., Proto 2022-12-25) - returns negative numbers around -5 (e.g., -4.97...)
   * 7. Prototypes without a date (e.g., Proto) - returns -6
   *
   * @private
   * @memberof FileParserService
   * @param {string} nameNoExt The filename without the extension.
   * @returns {number} The parsed revision number. Higher positive numbers indicate higher releases.
   *                   Negative numbers indicate pre-releases, with a specific range for each type (Beta, Alpha, Proto).
   */
  _parseRevision(nameNoExt) {
    const lowerCaseName = nameNoExt.toLowerCase();

    // Prioritize numbered releases (e.g., v1.2.3, Rev 2)
    const versionMatch = lowerCaseName.match(/(?:\(v|ver|version|rev|revision)\.?\s*([\d\.]+)\)/);
    if (versionMatch && versionMatch[1]) {
      const parts = versionMatch[1].split('.').map(p => parseInt(p, 10) || 0);
      let num = 0;
      if (parts.length > 0) num += parts[0];
      if (parts.length > 1) num += parts[1] / 1000; // Minor version
      if (parts.length > 2) num += parts[2] / 1000000; // Patch version
      return num;
    }

    // Numbered Beta releases (e.g., Beta 2)
    const betaNumMatch = lowerCaseName.match(/(?:\(beta)\s*(\d+)\)/);
    if (betaNumMatch && betaNumMatch[1]) {
      const num = parseInt(betaNumMatch[1], 10);
      return -1 + num / 100; // e.g., Beta 2 -> -1 + 0.02 = -0.98
    }

    // Simple Beta releases (e.g., Beta)
    if (lowerCaseName.includes('(beta)')) {
      return -2;
    }

    // Numbered Alpha releases (e.g., Alpha 1)
    const alphaNumMatch = lowerCaseName.match(/(?:\(alpha)\s*(\d+)\)/);
    if (alphaNumMatch && alphaNumMatch[1]) {
      const num = parseInt(alphaNumMatch[1], 10);
      return -3 + num / 100; // e.g., Alpha 1 -> -3 + 0.01 = -2.99
    }

    // Simple Alpha releases (e.g., Alpha)
    if (lowerCaseName.includes('(alpha)')) {
      return -4;
    }

    // Prototypes with a date (e.g., Proto 2022-12-25)
    if (lowerCaseName.includes('(proto)')) {
      const dateMatch = lowerCaseName.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1]) {
        const dateAsNum = parseInt(dateMatch[1].replace(/-/g, ''), 10); // YYYYMMDD
        return -5 + dateAsNum / 100000000; // e.g., Proto 2022-12-25 -> -5 + 20221225/100000000 = -4.97978775
      }
      return -6; // Simple Proto
    }

    return 0.0; // Default if no revision found
  }

  /**
   * Categorizes a single tag into a predefined group (e.g., "Region", "Language", "Other").
   * The categorization logic is based on keywords found within the tag.
   * @memberof FileParserService
   * @param {string} tag The tag string to categorize.
   * @returns {string} The category of the tag (e.g., "Region", "Language", "Other").
   */
  categorizeTag(tag) {
    const trimmedTag = tag.trim();

    const parts = trimmedTag.split(/[,\+]/).map(p => p.trim());
    const lowerParts = parts.map(p => p.toLowerCase());

    const regionKeywords = ['usa', 'japan', 'europe', 'world', 'asia', 'australia', 'brazil', 'canada', 'china', 'denmark', 'finland', 'france', 'germany', 'greece', 'hong kong', 'israel', 'italy', 'korea', 'netherlands', 'norway', 'poland', 'portugal', 'russia', 'spain', 'sweden', 'taiwan', 'uk', 'united kingdom'];
    const regionSet = new Set(regionKeywords);
    const regionCount = lowerParts.filter(p => regionSet.has(p)).length;
    if (regionCount > 0 && (regionCount / parts.length) >= 0.5) { // If at least 50% of sub-parts are region keywords
      return 'Region';
    }

    const langKeywords = ['en', 'ja', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'sv', 'no', 'da', 'fi', 'zh', 'ko', 'pl', 'ru', 'he', 'ca', 'ar', 'tr', 'zh-hant', 'zh-hans'];
    const langSet = new Set(langKeywords);
    const langCount = lowerParts.filter(p => langSet.has(p)).length;
    if (langCount > 0 && (langCount / parts.length) >= 0.5) { // If at least 50% of sub-parts are language keywords
      return 'Language';
    }

    return 'Other';
  }

  /**
   * Parses a list of file and directory objects to extract information for each and aggregates all unique tags from files.
   * @memberof FileParserService
   * @param {Array<{name: string, href: string, type: 'file'|'directory'}>} items An array of file and directory objects.
   *   Each object should have at least `name` (string), `href` (string), and `type` ('file' or 'directory') properties.
   * @returns {{files: Array<object>, tags: object}} An object containing:
   *   - `files`: An array of parsed file/directory objects. For files, these include `name_raw`, `base_name`, `tags`, `categorizedTags`, `revision`, `href`, `type`.
   *              For directories, they include `name_raw`, `base_name`, `href`, `type`, and default empty/zero values for other properties.
   *   - `tags`: An object where keys are tag categories (e.g., "Region", "Language", "Other") and values are arrays of unique tags found across all parsed files in that category.
   */
  parseFiles(items) {
    const allParsedItems = [];
    const allTags = {};

    for (const item of items) {
      if (item.type === 'directory') {
        allParsedItems.push({
          name_raw: item.name,
          base_name: item.name,
          tags: [],
          categorizedTags: {},
          revision: 0,
          href: item.href,
          type: 'directory'
        });
      } else {
        const parsed = this.parseFilename(item.name);
        parsed.href = item.href;
        parsed.type = 'file';
        allParsedItems.push(parsed);
        for (const category in parsed.categorizedTags) {
          if (!allTags[category]) {
            allTags[category] = new Set();
          }
          for (const tag of parsed.categorizedTags[category]) {
            allTags[category].add(tag);
          }
        }
      }
    }

    const allTagsAsArrays = {};
    for (const category in allTags) {
      allTagsAsArrays[category] = Array.from(allTags[category]);
    }

    return { files: allParsedItems, tags: allTagsAsArrays };
  }
}

export default FileParserService;
