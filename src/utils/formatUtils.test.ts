import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDay, formatTime, getHostname } from "./formatUtils";

describe("formatUtils", () => {
  describe("formatDay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'Today' for current date", () => {
      vi.setSystemTime(new Date(2024, 0, 15, 10, 0, 0));
      const today = new Date(2024, 0, 15);
      expect(formatDay(today)).toBe("Today");
    });

    it("returns 'Tomorrow' for next day", () => {
      vi.setSystemTime(new Date(2024, 0, 15, 10, 0, 0));
      const tomorrow = new Date(2024, 0, 16);
      expect(formatDay(tomorrow)).toBe("Tomorrow");
    });

    it("returns formatted date for other days", () => {
      vi.setSystemTime(new Date(2024, 0, 15, 10, 0, 0));
      const futureDate = new Date(2024, 0, 20);
      const result = formatDay(futureDate);
      // Should include weekday, month, and day
      expect(result).toContain("Saturday");
      expect(result).toContain("January");
      expect(result).toContain("20");
    });

    it("handles midnight edge case", () => {
      vi.setSystemTime(new Date(2024, 0, 15, 0, 0, 0));
      const today = new Date(2024, 0, 15, 23, 59, 59);
      expect(formatDay(today)).toBe("Today");
    });

    it("handles year boundary", () => {
      vi.setSystemTime(new Date(2024, 11, 31, 10, 0, 0));
      const tomorrow = new Date(2025, 0, 1);
      expect(formatDay(tomorrow)).toBe("Tomorrow");
    });
  });

  describe("formatTime", () => {
    it("formats morning time correctly", () => {
      const timestamp = new Date(2024, 0, 15, 8, 30, 0).getTime();
      const result = formatTime(timestamp);
      expect(result).toMatch(/8:30\s*AM/i);
    });

    it("formats afternoon time correctly", () => {
      const timestamp = new Date(2024, 0, 15, 14, 45, 0).getTime();
      const result = formatTime(timestamp);
      expect(result).toMatch(/2:45\s*PM/i);
    });

    it("formats midnight correctly", () => {
      const timestamp = new Date(2024, 0, 15, 0, 0, 0).getTime();
      const result = formatTime(timestamp);
      expect(result).toMatch(/12:00\s*AM/i);
    });

    it("formats noon correctly", () => {
      const timestamp = new Date(2024, 0, 15, 12, 0, 0).getTime();
      const result = formatTime(timestamp);
      expect(result).toMatch(/12:00\s*PM/i);
    });
  });

  describe("getHostname", () => {
    it("extracts hostname from valid URL", () => {
      expect(getHostname("https://example.com/path")).toBe("example.com");
      expect(getHostname("https://www.google.com")).toBe("www.google.com");
    });

    it("handles URL with port", () => {
      expect(getHostname("http://localhost:3000")).toBe("localhost");
    });

    it("handles URL with authentication", () => {
      expect(getHostname("https://user:pass@example.com")).toBe("example.com");
    });

    it("returns 'Unknown' for undefined", () => {
      expect(getHostname(undefined)).toBe("Unknown");
    });

    it("returns 'Unknown' for empty string", () => {
      expect(getHostname("")).toBe("Unknown");
    });

    it("returns 'Unknown' for invalid URL", () => {
      expect(getHostname("not-a-url")).toBe("Unknown");
      expect(getHostname("://missing-protocol")).toBe("Unknown");
    });

    it("handles chrome:// URLs", () => {
      expect(getHostname("chrome://extensions")).toBe("extensions");
    });

    it("handles file:// URLs", () => {
      const result = getHostname("file:///path/to/file.html");
      expect(result).toBe("");
    });
  });
});
