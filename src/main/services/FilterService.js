/**
 * Service responsible for applying various filters to a list of files,
 * including tag-based filtering, revision filtering, and deduplication.
 * @class
 */
class FilterService {
  /**
   * Applies a series of filters (tag, revision, deduplication) to a list of files.
   * @memberof FilterService
   * @param {Array<object>} allFiles The initial list of file objects to filter. Each file object should have at least `tags`, `base_name`, and `revision` properties.
   * @param {object} filters An object containing the filter criteria:
   *   - `include_tags` (Array<string>): Tags that files must possess.
   *   - `exclude_tags` (Array<string>): Tags that files must NOT possess.
   *   - `rev_mode` (string): Revision mode ('all', 'highest').
   *   - `dedupe_mode` (string): Deduplication mode ('all', 'priority').
   *   - `priority_list` (Array<string>): Ordered list of tags for 'priority' deduplication.
   * @returns {Array<object>} The filtered list of file objects.
   */
  applyFilters(allFiles, filters) {
    const listAfterTags = this._applyTagFilter(allFiles, filters.include_tags, filters.exclude_tags);
    const listAfterRev = this._applyRevisionFilter(listAfterTags, filters);
    const finalList = this._applyDedupeFilter(listAfterRev, filters);
    return finalList;
  }

  /**
   * Applies include/exclude tag filtering to a list of files.
   * @private
   * @memberof FilterService
   * @param {Array<object>} fileList The list of file objects to filter.
   * @param {Array<string>} includeTags An array of tags; files must contain at least one of these if specified.
   * @param {Array<string>} excludeTags An array of tags; files must not contain any of these if specified.
   * @returns {Array<object>} The filtered file list.
   */
  _applyTagFilter(fileList, includeTags, excludeTags) {
    const includeTagsSet = new Set(includeTags || []);
    const excludeTagsSet = new Set(excludeTags || []);

    if (includeTagsSet.size === 0 && excludeTagsSet.size === 0) {
      return fileList;
    }

    return fileList.filter(file => {
      const fileHasIncludeTag = includeTagsSet.size === 0 || file.tags.some(tag => includeTagsSet.has(tag));
      const fileHasNoExcludeTag = excludeTagsSet.size === 0 || !file.tags.some(tag => excludeTagsSet.has(tag));
      return fileHasIncludeTag && fileHasNoExcludeTag;
    });
  }

  /**
   * Applies revision-based filtering to a list of files, typically keeping only the highest revision.
   * @private
   * @memberof FilterService
   * @param {Array<object>} fileList The list of file objects to filter.
   * @param {object} filters The filter criteria, including `rev_mode` (e.g., 'all', 'highest').
   * @returns {Array<object>} The filtered list of file objects.
   */
  _applyRevisionFilter(fileList, filters) {
    const mode = filters.rev_mode || 'all';
    if (mode === 'all') return fileList;

    if (mode === 'highest') {
      const groupedGames = new Map();
      for (const fileInfo of fileList) {
        if (!groupedGames.has(fileInfo.base_name)) {
          groupedGames.set(fileInfo.base_name, []);
        }
        groupedGames.get(fileInfo.base_name).push(fileInfo);
      }

      const finalList = [];
      for (const [baseName, filesForGame] of groupedGames.entries()) {
        if (filesForGame.length === 0) continue;

        const maxRevision = Math.max(...filesForGame.map(f => f.revision));

        // In case of multiple files having the same highest revision, keep them all
        const highestRevisionFiles = filesForGame.filter(f => f.revision === maxRevision);
        finalList.push(...highestRevisionFiles);
      }
      return finalList;
    }
    return fileList;
  }

  /**
   * Applies deduplication filtering to a list of files, based on different modes (e.g., 'priority').
   * @private
   * @memberof FilterService
   * @param {Array<object>} fileList The list of file objects to filter.
   * @param {object} filters The filter criteria, including `dedupe_mode` ('all', 'priority') and `priority_list` (Array<string>).
   * @returns {Array<object>} The deduplicated list of file objects.
   */
  _applyDedupeFilter(fileList, filters) {
    const mode = filters.dedupe_mode || 'all';
    if (mode === 'all') return fileList;

    if (mode === 'priority') {
      const { priority_list: priorityList = [] } = filters;

      const maxScore = priorityList.length;
      const priorityMap = new Map(priorityList.map((tag, i) => [tag, maxScore - i]));

      const groupedGames = new Map();
      for (const fileInfo of fileList) {
        if (!groupedGames.has(fileInfo.base_name)) {
          groupedGames.set(fileInfo.base_name, []);
        }
        groupedGames.get(fileInfo.base_name).push(fileInfo);
      }

      const finalList = [];
      for (const [baseName, gameVersions] of groupedGames.entries()) {
        if (gameVersions.length === 0) continue;

        let bestFile = null;
        let bestScore = -1;

        for (const fileInfo of gameVersions) {
          let currentScore = 0;
          for (const tag of fileInfo.tags) {
            currentScore += (priorityMap.get(tag) || 0);
          }

          if (currentScore > bestScore) {
            bestScore = currentScore;
            bestFile = fileInfo;
          }
        }

        if (!bestFile) {
          bestFile = gameVersions[0]; // Fallback to the first file if no tags match priority list
        }

        const hasDiscTag = (file) => file.tags.some(t => /^(Disc|Cart|Side) /.test(t));

        // Collect all files that have the best calculated score, in case of ties
        const allFilesWithBestScore = gameVersions.filter(f => {
          let currentScore = 0;
          for (const tag of f.tags) {
            currentScore += (priorityMap.get(tag) || 0);
          }
          return currentScore === bestScore;
        });

        // If there are disc files among those with the best score, prioritize them
        const discFilesWithBestScore = allFilesWithBestScore.filter(hasDiscTag);

        if (discFilesWithBestScore.length > 0) {
          finalList.push(...discFilesWithBestScore);
        } else {
          finalList.push(bestFile);
        }
      }
      return [...new Set(finalList)]; // Ensure uniqueness in the final list
    }
    return fileList;
  }
}

export default FilterService;