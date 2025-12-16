# Changelog

All notable changes to this project will be documented in this file.

## [v0.0.0] - Unreleased

### Added
- **Timezone Combobox**: Replaced dropdown with searchable city selection (e.g., "New York", "Tokyo").
- **DST Support**: Integrated `date-fns-tz` for accurate Daylight Saving Time calculations and display.
- **Dynamic Offsets**: Timezone list now maps current GMT offsets (e.g., `(GMT +9:00)`).
- **Export/Import**: Export and import snoozed tabs in OneTab-compatible format (`URL | Title`).
- **Shift+Shortcut**: Hold Shift while pressing shortcuts to snooze entire window instead of selected tabs.
- **Snoozed Button**: Added "Snoozed" button to Popup header with count badge (displays 999+ for large counts).
- **Overdue Restoration**: Tabs past their scheduled snooze time are now restored immediately on browser startup.

### Changed
- **Settings Layout**: Morning, Evening, and Timezone settings are now on a single row.
- **Popup Scope UI**: Reduced button size, added "Default" / "Hold Shift" labels under scope selection.
- **Popup Title**: Changed to "Snooooze" with playful branding.
- **Settings Button**: Now opens directly to the Settings tab (using URL hash).
- **UI Refresh**: Applied "Neo Carbon" dark theme for modern aesthetic.
- **SelectLabel Styling**: Darkened timezone group labels for better visual hierarchy.

### Removed
- **Badge Count**: Removed unread badge count from extension icon.
- **Radio Indicators**: Visually hidden radio buttons in scope selection (functionality preserved).

### Fixed
- **Race Condition**: Fixed data loss when snoozing multiple tabs simultaneously.
