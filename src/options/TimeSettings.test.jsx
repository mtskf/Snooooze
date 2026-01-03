
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimeSettings from './TimeSettings';

// Mock UI components that might interfere with simple testing if complex
// But Select is from shadcn (radix), ensuring it works in JSDOM is key.
// We will test interaction if possible, or at least rendering.
// Radix primitives can be tricky in JSDOM without pointer events polyfills sometimes.
// We'll rely on basic accessibility roles.

describe('TimeSettings', () => {
  it('renders start and end day selectors', () => {
    const settings = {};
    const updateSetting = vi.fn();
    render(<TimeSettings settings={settings} updateSetting={updateSetting} />);

    expect(screen.getByText('Start Day (Morning)')).toBeInTheDocument();
    expect(screen.getByText('End Day (Evening)')).toBeInTheDocument();
  });

  it('displays current settings values', () => {
    const settings = {
        'start-day': '9:00 AM',
        'end-day': '6:00 PM'
    };
    const updateSetting = vi.fn();
    // We look for the trigger buttons reacting to value
    render(<TimeSettings settings={settings} updateSetting={updateSetting} />);

    // Radix Select trigger usually contains the value text
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('6:00 PM')).toBeInTheDocument();
  });

  it('falls back to defaults if settings are empty', () => {
    const settings = {}; // Defaults: 8:00 AM, 5:00 PM
    const updateSetting = vi.fn();
    render(<TimeSettings settings={settings} updateSetting={updateSetting} />);

    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
    expect(screen.getByText('5:00 PM')).toBeInTheDocument();
  });

  // Note: Full interaction testing with Radix Select in JSDOM often requires
  // user-event and ensuring pointer event mocks.
  // For unit testing this component, verifying it renders correct props is sufficient
  // if we assume the library component works.
});
