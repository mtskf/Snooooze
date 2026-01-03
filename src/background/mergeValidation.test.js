
import { describe, test, expect, vi } from 'vitest';
import { getSettings } from './snoozeLogic';
import * as constants from '../utils/constants';

// Mock DEFAULT_SETTINGS
vi.mock('../utils/constants', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DEFAULT_SETTINGS: {
      existingKey: 'default',
      newKey: 'defaultValue'
    }
  };
});

const chromeMock = {
  storage: {
    local: {
      get: vi.fn(),
    }
  }
};
global.chrome = chromeMock;
global.Intl = {
    DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'Test/Zone' })
    })
};

describe('getSettings Merge Verification', () => {
    test('merges default settings with saved settings', async () => {
        // saved settings only has existingKey, lacks newKey
        chromeMock.storage.local.get.mockResolvedValue({
            settings: { existingKey: 'userValue' }
        });

        const settings = await getSettings();

        // Should preserve user value
        expect(settings.existingKey).toBe('userValue');
        // Should inject default for missing key
        expect(settings.newKey).toBe('defaultValue');
        // Should inject timezone
        expect(settings.timezone).toBe('Test/Zone');
    });

    test('returns defaults if settings is undefined', async () => {
        chromeMock.storage.local.get.mockResolvedValue({});

        const settings = await getSettings();

        expect(settings.existingKey).toBe('default');
        expect(settings.timezone).toBe('Test/Zone');
    });
});
