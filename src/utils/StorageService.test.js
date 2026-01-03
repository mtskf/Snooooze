import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageService } from "./StorageService";

function makeValidTabs() {
  return {
    tabCount: 1,
    "1700000000000": [
      {
        url: "https://example.com",
        title: "Example",
        creationTime: 1700000000000,
        popTime: 1700000000000,
      },
    ],
  };
}

describe("StorageService", () => {
  describe("exportTabs", () => {
    let createObjectURLSpy;
    let revokeObjectURLSpy;
    let createElementSpy;
    let anchor;

    beforeEach(() => {
      createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:export");
      revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      const originalCreate = document.createElement.bind(document);
      createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tag) => {
          if (tag === "a") {
            anchor = originalCreate("a");
            anchor.click = vi.fn();
            return anchor;
          }
          return originalCreate(tag);
        });
    });

    afterEach(() => {
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it("throws when there is no data to export", () => {
      expect(() => StorageService.exportTabs({})).toThrow(
        "No tabs to export."
      );
      expect(() => StorageService.exportTabs({ tabCount: 0 })).toThrow(
        "No tabs to export."
      );
    });

    it("creates a download for valid data", () => {
      StorageService.exportTabs(makeValidTabs());

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(anchor).toBeDefined();
      expect(anchor.download).toMatch(/^snooooze-export-\d{4}-\d{2}-\d{2}\.json$/);
      expect(anchor.click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:export");
    });
  });

  describe("parseImportFile", () => {
    it("rejects invalid JSON", async () => {
      const file = new File(["{invalid"], "bad.json", {
        type: "application/json",
      });

      await expect(StorageService.parseImportFile(file)).rejects.toBeDefined();
    });

    it("rejects unrecoverable data", async () => {
      const file = new File([JSON.stringify(["not", "object"])], "bad.json", {
        type: "application/json",
      });

      await expect(StorageService.parseImportFile(file)).rejects.toThrow(
        "Invalid data structure that cannot be repaired"
      );
    });

    it("repairs data when possible", async () => {
      const data = {
        tabCount: 2,
        "1700000000000": [
          {
            url: "https://example.com",
            title: "Example",
            creationTime: 1700000000000,
            popTime: 1700000000000,
          },
        ],
      };
      const file = new File([JSON.stringify(data)], "ok.json", {
        type: "application/json",
      });

      const result = await StorageService.parseImportFile(file);
      expect(result.tabCount).toBe(1);
      expect(result["1700000000000"]).toHaveLength(1);
    });
  });

  describe("mergeTabs", () => {
    it("merges imported tabs and recalculates tabCount", () => {
      const current = {
        tabCount: 1,
        "100": [
          {
            url: "https://a.com",
            title: "A",
            creationTime: 1,
            popTime: 100,
          },
        ],
      };
      const imported = {
        tabCount: 2,
        "200": [
          {
            url: "https://b.com",
            title: "B",
            creationTime: 2,
            popTime: 200,
          },
          {
            url: "https://c.com",
            title: "C",
            creationTime: 3,
            popTime: 200,
          },
        ],
      };

      const { mergedData, addedCount } = StorageService.mergeTabs(
        current,
        imported
      );

      expect(addedCount).toBe(2);
      expect(mergedData.tabCount).toBe(3);
      expect(mergedData["100"]).toHaveLength(1);
      expect(mergedData["200"]).toHaveLength(2);
    });
  });
});
