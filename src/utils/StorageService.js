
import { validateSnoozedTabs, sanitizeSnoozedTabs } from "./validation";

export const StorageService = {
  /**
   * Triggers a browser download of the given data as a JSON file.
   * @param {Object} data - The data directly from storage (snoozedTabs).
   */
  exportTabs: (data) => {
    if (
      !data ||
      Object.keys(data).length === 0 ||
      (Object.keys(data).length === 1 && data.tabCount === 0)
    ) {
      throw new Error("No tabs to export.");
    }

    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snooooze-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Reads and parses a JSON file, validates it, and prepares it for storage.
   * @param {File} file - The file object from input[type="file"].
   * @returns {Promise<Object>} - The valid data object to be merged/saved.
   */
  parseImportFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let importedTabs = JSON.parse(e.target.result);

          const validation = validateSnoozedTabs(importedTabs);
          if (!validation.valid && !validation.repairable) {
            console.error("Validation errors (unrecoverable):", validation.errors);
            reject(new Error("Invalid data structure that cannot be repaired"));
            return;
          }

          if (!validation.valid && validation.repairable) {
            console.warn("Repairing imported data:", validation.errors);
            importedTabs = sanitizeSnoozedTabs(importedTabs);
          }

          resolve(importedTabs);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  },

  /**
   * Merges imported tabs into the current snoozed tabs structure.
   * @param {Object} currentTabs - The current tabs from storage.
   * @param {Object} importedTabs - The parsed and validated imported data.
   * @returns {Object} - The result object containing { mergedData, addedCount }.
   */
  mergeTabs: (currentTabs, importedTabs) => {
    const merged = JSON.parse(JSON.stringify(currentTabs || { tabCount: 0 }));
    let addedCount = 0;

    Object.keys(importedTabs).forEach((key) => {
      if (key === "tabCount") return;

      const tabsList = importedTabs[key];
      if (Array.isArray(tabsList)) {
        if (!merged[key]) {
          merged[key] = [];
        }
        merged[key].push(...tabsList);
        addedCount += tabsList.length;
      }
    });

    // Recalculate total count
    let totalCount = 0;
    Object.keys(merged).forEach((k) => {
      if (k !== "tabCount" && Array.isArray(merged[k])) {
        totalCount += merged[k].length;
      }
    });
    merged.tabCount = totalCount;

    return { mergedData: merged, addedCount };
  }
};
