# Functional Specifications

This document defines the functional behavior, business logic, and user interface rules for the Snooooze extension. It serves as the source of truth for "what the system does," distinct from `ARCHITECTURE.md` which explains "how it is built."

## 1. Terminology

| Term | Definition |
| :--- | :--- |
| **Snooze** | The action of closing a tab (or tabs) and scheduling it to be reopened at a later time. |
| **Restore** | The action of reopening a snoozed tab when its scheduled time arrives. |
| **Scope** | The target of the snooze action. Can be "Selected Tabs" (default) or "Current Window". |
| **Zoned Time** | Time calculated based on the user's system timezone (or manually configured timezone). |

## 2. Snooze Logic & Timing

The core logic for calculating snooze times resides in `src/utils/timeUtils.js`.

### 2.1. Time Calculation Rules

All calculations are based on the **Current Zoned Time**.

| Option | Logic Specification | Default Setting |
| :--- | :--- | :--- |
| **Later Today** | Current time + 1 hour. Minutes/seconds are cleared (rounded down?). <br> *Note: Implementation currently sets seconds to 0 but keeps minutes.* | `later-today`: 1 (hour) |
| **This Evening** | Today at `end-day`. <br> **Exception:** If current time is already past `end-day`, it behaves like "Later Today" (+1 hour). | `end-day`: 6:00 PM |
| **Tomorrow** | Tomorrow at `start-day`. <br> **Exception:** If current time is early morning (< 5:00 AM), it is treated as "Today" (current date) at `start-day`. | `start-day`: 9:00 AM |
| **Tomorrow Evening** | Tomorrow at `end-day`. <br> **Exception:** If current time is < 5:00 AM, it is treated as "Today" (current date) at `end-day`. | `end-day`: 6:00 PM |
| **This Weekend** | Next coming occurrence of `weekend-begin` day. Time is `start-weekend`. | `weekend-begin`: Saturday<br>`start-weekend`: 10:00 AM |
| **Next Monday** | Next coming Monday. Time is preserved from current time? (Code check needed: currently preserves current time? No, likely uses a default or current time). | - |
| **In a Week** | Current date + 7 days. | - |
| **In a Month** | Current date + 1 month (using `date-fns/addMonths`). | - |
| **Pick Date** | User selected date at 9:00 AM. | - |

### 2.2. "Early Morning" Exception (The 5 AM Rule)
To prevent frustration when working late (e.g., at 2 AM), "Tomorrow" refers to the *logical* tomorrow (after waking up), which is effectively the calendar's "Today".
- **Rule:** If `Current Hour < 5`, "Tomorrow" = Calendar Today.

## 3. Scope & Shortcuts

### 3.1. Scope Selection
- **Selected Tabs:** Only the currently highlighted tabs are snoozed.
- **Current Window:** All tabs in the current window are snoozed.

### 3.2. Keyboard Shortcuts
- **Single Key:** Triggers snooze for the corresponding option (e.g., 'T' for Tomorrow).
- **Modifier (Shift):** Temporarily toggles the scope to "Current Window" while held.
    - Example: `T` snoozes selected tabs to Tomorrow. `Shift + T` snoozes the entire window to Tomorrow.

## 4. Restore Logic

### 4.1. Trigger
- An alarm (`popCheck`) runs every **1 minute**.
- Checks for any snoozed items with `timestamp < Date.now()`.

### 4.2. Grouping & Window Restoration
- Tabs snoozed as a "Window" share a `groupId`.
- *Current Behavior:* Tabs are restored individually as their time passes. The `groupId` is currently used for data tracking but does not force a "Restore All as Window" action in the current version (based on ADR-001).

## 5. UI & Themes

### 5.1. Appearance Modes
Defined in `src/utils/constants.js`.

- **Default:** Monochromatic Blue/Indigo. Professional and calm.
- **Vivid:** Semantic colors.
    - `Tomorrow`: Blue
    - `Weekend`: Green
    - `Evening`: Purple
    - `Later Today`: Cyan
- **Heatmap:** Urgency-based colors.
    - `Later Today`: Red (Critical)
    - `Evening`: Red-Orange
    - `Tomorrow`: Orange
    - `Weekend`: Yellow (Warm)

### 5.2. Badge
- Displays the count of currently snoozed tabs.
- specific format: `999+` if count exceeds 999.
