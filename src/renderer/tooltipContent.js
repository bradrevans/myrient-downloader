/**
 * @typedef {object} TooltipContent
 * @property {string} revisionMode - Explanation for revision mode.
 * @property {string} dedupeMode - Explanation for deduplication mode.
 * @property {string} priorityList - Explanation for the priority list.
 * @property {string} availableTags - Explanation for available tags.
 * @property {string} regionFiltering - Explanation for region filtering.
 * @property {string} languageFiltering - Explanation for language filtering.
 * @property {string} otherFiltering - Explanation for other filtering.
 * @property {string} includeTags - Explanation for include tags.
 * @property {string} excludeTags - Explanation for exclude tags.
 * @property {string} maintainSiteFolderStructure - Explanation for maintaining site folder structure.
 * @property {string} createSubfolder - Explanation for creating subfolders.
 * @property {string} extractArchives - Explanation for extracting archives.
 * @property {string} extractPreviouslyDownloaded - Explanation for extracting previously downloaded archives.
 * @property {string} overallDownloadProgress - Explanation for overall download progress.
 * @property {string} fileDownloadProgress - Explanation for file download progress.
 * @property {string} overallExtractionProgress - Explanation for overall extraction progress.
 * @property {string} fileExtractionProgress - Explanation for file extraction progress.
 * @property {string} throttleSpeed - Explanation for throttle speed.
 * @property {string} downloadOptions - Explanation for download options.
 */

/**
 * Contains tooltip messages for various UI elements in the renderer process.
 * @type {TooltipContent}
 */
const tooltipContent = {
  revisionMode: "Determines which revisions of ROMs are kept when multiple versions exist. 'Highest' keeps only the newest revision (based on revision number), and 'All' includes all revisions found.",
  dedupeMode: "Controls how duplicate ROMs (files with identical base names) are handled. 'Priority' uses your custom priority list to select a single preferred file (or defaults to one at random if you haven't set priorities). 'All' keeps all duplicate files.",
  priorityList: "Drag and drop tags from the 'Available' list here to create a priority order. ROMs containing tags higher in this list will be preferred when de-duplicating files using 'Priority' de-duplication mode. You can reorder them by dragging.",
  availableTags: "These are all the unique tags you have selected to include above. Drag tags from this list to the 'Priority' list to influence de-duplication.",
  regionFiltering: "Filter ROMs based on their geographical region tags (e.g., USA, Europe, Japan). Select tags to include or exclude specific regions. Selecting nothing in any of the lists will default to including all tags.",
  languageFiltering: "Filter ROMs based on their language tags (e.g., En, Fr, De). Select tags to include or exclude specific languages.",
  otherFiltering: "Filter ROMs based on miscellaneous tags (e.g., Beta, Demo, Unlicensed). Select tags to include or exclude specific categories.",
  includeTags: "Tags selected here will be INCLUDED in your filtered results. Only ROMs containing at least one of these tags will be shown.",
  excludeTags: "Tags selected here will be EXCLUDED from your filtered results. ROMs containing any of these tags will be removed from the results.",
  maintainSiteFolderStructure: "If checked, the folder structure of the site will be re-created on your local machine within the download directory.",
  createSubfolder: "If checked, downloaded files will be organized into a subfolder named after the archive (e.g., 'Title (Region)') within your chosen download directory.",
  extractArchives: "If checked, downloaded compressed archives will be automatically extracted to their contents, and the original archive file will be deleted after successful extraction.",
  extractPreviouslyDownloaded: "If checked, any existing compressed archives in your download directory that were previously downloaded will also be extracted and deleted.",
  overallDownloadProgress: "Shows the combined progress for all files being downloaded.",
  fileDownloadProgress: "Shows the progress for the currently downloading file.",
  overallExtractionProgress: "Shows the combined progress for all archives being extracted.",
  fileExtractionProgress: "Shows the progress for the currently extracting archive.",
  throttleSpeed: "Limit the download speed to the specified value. This is useful for managing bandwidth usage. You can set the speed in Kilobytes per second (KB/s) or Megabytes per second (MB/s).",
  downloadOptions: "Configure how files are downloaded and processed."
};

export default tooltipContent;
