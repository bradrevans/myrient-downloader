const CURRENT_FILTER_PRESET_VERSION = 2; // Increment version due to format change

/**
 * Migrates an old filter preset object to the current format.
 * @param {object} oldFilter - The filter preset object in the old format.
 * @returns {object} The filter preset object in the new format.
 */
function migrateFilterPreset(oldFilter) {
  // If the filter already has the current version, return it as is.
  if (oldFilter._version === CURRENT_FILTER_PRESET_VERSION) {
    return oldFilter;
  }

  const newFilter = {
    name: oldFilter.name,
    // Construct fullPath and pathDisplayName from old archive/directory info
    fullPath: oldFilter.archiveHref + oldFilter.directoryHref,
    pathDisplayName: oldFilter.archiveName + ' / ' + oldFilter.directoryName,
    filterSettings: {
      include_tags: {
        region: oldFilter.filterSettings.includedRegions || [],
        language: oldFilter.filterSettings.includedLanguages || [],
        other: [], // New field, initialize as empty
      },
      exclude_tags: {
        region: oldFilter.filterSettings.excludedRegions || [],
        language: oldFilter.filterSettings.excludedLanguages || [],
        other: [], // New field, initialize as empty
      },
      include_strings: oldFilter.filterSettings.includeStrings || [],
      exclude_strings: oldFilter.filterSettings.excludeStrings || [],
      rev_mode: oldFilter.filterSettings.releaseRevisionMode || 'highest', // Default value
      dedupe_mode: oldFilter.filterSettings.deduplicateMode || 'priority', // Default value
      priority_list: oldFilter.filterSettings.releaseNamePriorityList || [],
    },
    _version: CURRENT_FILTER_PRESET_VERSION, // Add version to the new format
  };

  return newFilter;
}

/**
 * Checks if a filter preset object is in the old format and needs migration.
 * This function can be expanded with more sophisticated checks if multiple old formats exist.
 * @param {object} filter - The filter preset object to check.
 * @returns {boolean} True if the filter needs migration, false otherwise.
 */
function needsMigration(filter) {
  // If the filter has a version, and it's the current version, it doesn't need migration.
  if (filter._version !== undefined && filter._version === CURRENT_FILTER_PRESET_VERSION) {
    return false;
  }
  // If it doesn't have _version, or it's an older version, assume it needs migration.
  // Check for presence of old fields like 'archiveHref' or 'directoryHref' to identify old format.
  return filter.archiveHref !== undefined || filter.directoryHref !== undefined;
}

export { migrateFilterPreset, needsMigration, CURRENT_FILTER_PRESET_VERSION };