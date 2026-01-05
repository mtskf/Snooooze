# Development Lessons

Key insights and patterns learned during development. Read this before starting any task.

## 🎨 UI & UX
- **Calendar & Dropdowns**: For `react-day-picker`, wrap native selects with styled containers (`relative > absolute invisible select`) to keep accessibility while matching design.
- **Modals**: Stop propagation on `Escape` (`onKeyDown`) and use `tabIndex={-1}` to manage focus/closing behavior correctly (prevents closing parent popups).
- **Modal Isolation**: Disable global keyboard handlers when modals are open to prevent conflicts.
- **Defaults**: Do not hardcode UI fallbacks (e.g. `8`). Always derive initial state from `DEFAULT_SETTINGS` constants.

## 🏗️ Architecture & State
- **Settings Merge**: Always merge defaults (`{ ...defaults, ...user }`) to support new options safely.
- **Background Truth**: UI must fetch state via messages, not direct storage reads. Import logic belongs in the background/service layer.
- **Central Validation**: Use shared `src/utils/validation.js` for all data entry points (Import, Backup, Recovery).
- **Service Layer**: Delegate heavy logic (File IO, Repair) to `StorageService` to keep UI components thin.

## 🛡️ Robustness & Safety
- **Defensive Storage**: Always check for null/undefined before accessing storage properties. Initialize with defaults.
- **Promise Safety**: Always `.catch()` inside promise chains when using the mutex pattern (`p = p.then(...)`) to prevent permanent locks.
- **Infinite Loops**: In periodic tasks (`popCheck`), ensure failed items are modified/flagged to prevent retry loops.
- **Firefox Compatibility**: Feature-detect `chrome.storage.session` before use.
- **Error Handling**: Wrap critical reads (`getSettings`) in try-catch with safe fallbacks.

## 🧪 Testing & Process
- **Global Stubbing**: Use `vi.stubGlobal` / `vi.unstubAllGlobals` in tests to prevent state leakage (e.g. `chrome` object).
- **DOM Requirements**: UI components (Popup, Options) need `jsdom` environment.
- **PR Checks**: Verify PR status before pushing follow-ups to avoid working on merged branches.
