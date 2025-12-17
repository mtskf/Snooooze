# Development Lessons

Key insights and patterns learned during development. Read this before starting any task.

- **Calendar Customization**: Shadcn UI's Calendar (based on `react-day-picker` v8) requires careful handling of `captionLayout`. To get dropdowns without breaking layout, you often need to provide a custom `Dropdown` component that wraps the native select (for functionality) with a styled visual layer (for consistency).
- **Native Select Overlay**: A reliable pattern for custom dropdowns is `relative container > absolute invisible select + pointers-none visual label`. This preserves accessibility and native behavior (keyboard nav, mobile picker) while matching custom design systems.
- **Modal Escape Key**: When implementing custom modal overlays, add `onKeyDown` with `e.stopPropagation()` to prevent Escape from closing parent elements (like Chrome extension popups). Also add `tabIndex={-1}` to ensure the overlay receives keyboard events.
- **Settings Default Merging**: When adding new configurable options, always merge defaults with user settings (`{ ...defaults, ...userSettings }`) to ensure new options appear even for users with existing saved settings.