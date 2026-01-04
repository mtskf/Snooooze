# Architecture Overview

Quick reference for system design and implementation.

## Project Structure

```
Snooooze/
├── src/
│   ├── background/          # Service Worker (Manifest V3)
│   │   ├── serviceWorker.js # Alarm handling
│   │   └── snoozeLogic.js   # Storage & Tab mgmt logic
│   ├── popup/               # Extension popup UI
│   │   └── Popup.jsx        # Snooze options, scope selection
│   ├── options/             # Options/Settings page
│   │   └── Options.jsx      # Snoozed list, settings management
│   ├── components/ui/       # shadcn/ui components
│   ├── utils/               # Shared utilities
│   │   ├── ChromeApi.js     # Unified Chrome Extension API wrapper
│   │   ├── timeUtils.js     # Time calculations
│   │   ├── StorageService.js# Import/export helpers
│   │   ├── validation.js    # Storage data validation
│   │   ├── constants.js     # Config, Defaults, Theme colors
│   │   └── uuid.js          # UUID generation
│   ├── lib/                 # shadcn utilities (cn)
│   └── index.css            # Global styles (Neo Carbon theme)
├── dist/                    # Built extension
├── docs/                    # GitHub Pages (Website)
├── dev-docs/                # Developer Documentation
└── public/assets/           # Icons, manifest.json
```

## Core Components

### Chrome API Wrapper (`ChromeApi.js`)
- **Unified Abstraction**: Centralized wrapper for all Chrome Extension APIs (storage, tabs, windows, notifications, alarms, runtime, commands)
- **Promise-based**: Converts callback-based APIs to Promises for async/await support
- **Error Handling**: Consistent try-catch patterns with descriptive error messages
- **Firefox Compatibility**: Graceful fallbacks for unsupported APIs (session storage, getBytesInUse)
- **Testability**: Single mocking point for all Chrome API interactions in tests

### Service Worker (`serviceWorker.js` + `snoozeLogic.js`)
- **Alarm System**: `popCheck` runs every minute (or on startup) to restore overdue tabs
- **Storage**: `chrome.storage.local` for snoozed tabs and settings
- **Restoration**: Directly opens tabs when time is reached
- **Mutex Lock**: Promise-chain mutex (`storageLock`) prevents race conditions
- **Shared Config**: `DEFAULT_SETTINGS` imported from `constants.js`
- **Helper**: `getTabsByGroupId()` extracts tabs by group ID
- **Backup System**: Debounced 3-generation rotating backups with auto-recovery
- **Null Safety**: All storage operations guard against missing/corrupted data
- **Startup Recovery**: `initStorage()` validates `snoooze_v2` and invokes backup recovery + session notification when invalid

### Popup (`Popup.jsx`)
- **Scope Selection**: "Selected tabs" or "Window" (Shift key toggle)
- **Snooze Options**: Later today, Evening, Tomorrow, Weekend, etc.
- **Keyboard Shortcuts**: L, E, T, S, N, W, M, P for options, Shift+key for window scope
- **Snoozed Counter**: Shows pending tab count (999+ for large numbers)
- **Settings Fetch**: Uses `chrome.runtime.sendMessage({ action: "getSettings" })` to load settings from background

### Options (`Options.jsx`)
- **Snoozed List**: Grouped by date, with delete/restore actions
- **Settings**: Fetches via `getSettings` message (unified with Popup). Manage Morning/Evening times, Appearance theme.
- **Export/Import**: JSON format via `StorageService`
- **Import Merge**: Uses `getSnoozedTabs` message to fetch current data
- **URL Hash**: Supports `#settings` to open directly to Settings tab

## Data Storage

### `snoooze_v2` (chrome.storage.local)
**Normalized Relational Model**
```javascript
{
  "items": {
    "uuid-1234": {
      "id": "uuid-1234",
      "url": "https://example.com",
      "title": "Example",
      "popTime": 1702700400000,
      "creationTime": 1702700000000,
      "groupId": "optional-group-id"
    }
  },
  "schedule": {
    "1702700400000": ["uuid-1234", "uuid-5678"] // time -> [uuid]
  }
}
// Note: UI components use an adapter to read this as the legacy format.
```

### `settings` (chrome.storage.local)
```javascript
{
  "start-day": "8:00 AM",
  "end-day": "5:00 PM",
  "timezone": "Australia/Sydney",
  "appearance": "heatmap"
}
```

### Backup Keys (chrome.storage.local)
```javascript
"snoozedTabs_backup_<timestamp>": { /* same structure as snoozedTabs */ }
// Up to 3 rotating backups
```

### Session State (chrome.storage.session)
```javascript
{
  "pendingRecoveryNotification": 5,  // tab count if recovery needed
  "lastRecoveryNotifiedAt": 1704067200000
}
```

### Storage Size Warning (chrome.storage.local)
```javascript
{
  "sizeWarningActive": true,         // true if usage > 80%
  "lastSizeWarningAt": 1704067200000 // timestamp of last notification (24h throttle)
}
```

## Key Flows

### Snooze Flow
1. User selects scope (tabs/window) and time option
2. Service worker generates a UUID and stores tab data in `items` map and `schedule` index (V2 Normalized Schema)
3. Tab is closed (ONLY after successful storage save); popup window closes

### Restore Flow
1. `popCheck` alarm fires (every 1 min, or on startup)
2. Checks timestamps < `Date.now()`
3. **Directly restores tabs** (Current Window or New Window based on Snooze Scope)
4. Removes from storage (ONLY if restoration succeeded)

## Technologies
- **React** + **Vite** for UI
- **shadcn/ui** + **Tailwind CSS** for components
- **lucide-react** for icons
- **Chrome Extension Manifest V3**
