# Development Lessons

Key insights and patterns learned during development. Read this before starting any task.

- **Calendar Customization**: Shadcn UI's Calendar (based on `react-day-picker` v8) requires careful handling of `captionLayout`. To get dropdowns without breaking layout, you often need to provide a custom `Dropdown` component that wraps the native select (for functionality) with a styled visual layer (for consistency).
- **Native Select Overlay**: A reliable pattern for custom dropdowns is `relative container > absolute invisible select + pointers-none visual label`. This preserves accessibility and native behavior (keyboard nav, mobile picker) while matching custom design systems.
- **Modal Escape Key**: When implementing custom modal overlays, add `onKeyDown` with `e.stopPropagation()` to prevent Escape from closing parent elements (like Chrome extension popups). Also add `tabIndex={-1}` to ensure the overlay receives keyboard events.
- **Settings Default Merging**: When adding new configurable options, always merge defaults with user settings (`{ ...defaults, ...userSettings }`) to ensure new options appear even for users with existing saved settings.
- **Continuous PR Verification**: Before pushing follow-up changes to a feature branch, ALWAYS check if the associated PR is still open (`gh pr view`). If it has been merged, create a new branch or a new PR immediately. Never assume a PR is open just because the local branch exists.
- **Firefox & `chrome.storage.session`**: Firefox's MV3 implementation does not fully support `chrome.storage.session` in all contexts (or it requires specific permissions/configurations that differ from Chrome). Always wrap `chrome.storage.session` calls in a feature detection check (`if (chrome.storage.session) { ... }`) to prevent "undefined" errors on startup.
- **Defensive Storage Access**: Never assume `getSnoozedTabs()` returns a valid object. Always check for `null`/`undefined` before accessing properties. Initialize to `{ tabCount: 0 }` when creating new entries.
- **Centralize Validation**: Avoid duplicating validation logic (e.g., weak local validators in UI components). Use a shared utility (`src/utils/validation.js`) to ensure consistent schema enforcement across import, backup, and recovery.
- **Delegate Heavy UI Logic**: File IO and data repair (import/export) should live in a shared service (`StorageService`) to keep UI components small and make the logic testable.
- **Prefer Background as Source of Truth**: UI should fetch settings/state via background messages instead of direct `chrome.storage.local` reads to avoid drift.
- **Import Should Read via Background**: Merge imported data against `getSnoozedTabs` to stay aligned with the V2 adapter and avoid legacy overwrites.
- **UI Tests Require DOM Setup**: Unit tests for React components (`Popup.jsx`, `Options.jsx`, `useKeyboardNavigation.js`) require `@testing-library/react` and `jsdom` environment. Vitest's default Node environment cannot render components.
- **Promise Chain Mutexes**: When implementing a mutex pattern with `p = p.then(...)`, ALWAYS `.catch()` errors inside the chain update to prevent the persistent `p` from becoming rejected. If `p` rejects, all subsequent tasks chained to it will immediately reject, permanently locking the system.

- **Modal State & Global Shortcuts**: When a modal (calendar, dialog) is open, disable unrelated global keyboard handlers to prevent conflicts. Pass modal state as a prop to the keyboard hook and check it at the top of the handler.
- **Test Global Isolation**: When using Vitest, avoid modifying the global object (like `global.chrome`) directly in top-level describe blocks. This leaks state between test files. Use `vi.stubGlobal` in `beforeEach` and `vi.unstubAllGlobals` in `afterEach` to ensure clean isolation.
- **Single Source of Truth for Defaults**: Do not hardcode default values (e.g., `8` for 8 AM) in UI components' fallback logic. If `DEFAULT_SETTINGS` changes in `constants.js`, hardcoded UI fallbacks will drift. Always derive initial UI state from the shared constants (e.g., `parseTime(DEFAULT_SETTINGS['start-day'])`).
