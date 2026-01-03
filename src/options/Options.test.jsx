import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/timeUtils', () => ({
  getSettings: vi.fn().mockResolvedValue({
    'start-day': '8:00 AM',
    timezone: 'UTC',
  }),
}));

vi.mock('./TimeSettings', () => ({
  default: () => null,
}));
vi.mock('./GlobalShortcutSettings', () => ({
  default: () => null,
}));
vi.mock('./SnoozeActionSettings', () => ({
  default: () => null,
}));
vi.mock('./AppearanceSettings', () => ({
  default: () => null,
}));

import Options from './Options';

describe('Options', () => {
  const snoozedTabs = {
    '1704100000000': [
      {
        url: 'https://example.com',
        title: 'Example Tab',
        favicon: '',
        creationTime: 123,
        popTime: 1704100000000,
      },
    ],
    tabCount: 1,
  };

  let onChangedListener;
  let currentSnoozedTabs;

  beforeEach(() => {
    vi.clearAllMocks();
    currentSnoozedTabs = snoozedTabs;
    onChangedListener = undefined;

    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      const res = {};
      if (Array.isArray(keys)) {
        if (keys.includes('sizeWarningActive')) res.sizeWarningActive = false;
      } else if (keys === 'sizeWarningActive') {
        res.sizeWarningActive = false;
      }
      if (callback) callback(res);
      return Promise.resolve(res);
    });

    global.chrome.storage.onChanged = {
      addListener: vi.fn((listener) => {
        onChangedListener = listener;
      }),
      removeListener: vi.fn(),
    };

    global.chrome.commands = {
      getAll: vi.fn((callback) => callback([])),
    };

    global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'getSnoozedTabs') {
        if (callback) callback(currentSnoozedTabs);
        return;
      }
      if (callback) callback();
    });
  });

  it('requests snoozed tabs via runtime message and renders them', async () => {
    render(<Options />);

    await waitFor(() => {
      expect(screen.getByText('Example Tab')).toBeInTheDocument();
    });

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'getSnoozedTabs' }),
      expect.any(Function)
    );
  });

  it('refreshes snoozed tabs when snoooze_v2 changes', async () => {
    render(<Options />);

    await waitFor(() => {
      expect(screen.getByText('Example Tab')).toBeInTheDocument();
    });
    expect(onChangedListener).toBeTypeOf('function');

    currentSnoozedTabs = {
      '1704200000000': [
        {
          url: 'https://example.com/next',
          title: 'Next Tab',
          favicon: '',
          creationTime: 124,
          popTime: 1704200000000,
        },
      ],
      tabCount: 1,
    };

    act(() => {
      onChangedListener(
        { snoooze_v2: { newValue: { items: {}, schedule: {} } } },
        'local'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Next Tab')).toBeInTheDocument();
    });
  });
});
