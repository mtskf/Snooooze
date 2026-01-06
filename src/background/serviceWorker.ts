/**
 * Snooooze
 * background.ts (Manifest V3 Service Worker)
 */

import type { MessageServices } from '../messages';
import {
  initStorage,
  popCheck,
  snooze,
  removeSnoozedTabWrapper,
  removeWindowGroup,
  restoreWindowGroup,
  getSnoozedTabsV2,
  setSnoozedTabs,
  getSettings,
  setSettings,
  importTabs,
  getExportData,
} from "./snoozeLogic";
import { dispatchMessage } from "../messages";
import { storage, tabs, notifications, alarms, runtime } from "../utils/ChromeApi";

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  await initStorage();
  await alarms.create("popCheck", { periodInMinutes: 1 });
  // Check for overdue tabs immediately
  setTimeout(() => popCheck(), 1000);
  // Check for pending recovery notification
  await checkPendingRecoveryNotification();
});

// Run popCheck on browser startup (for persistent overdue tabs)
chrome.runtime.onStartup.addListener(async () => {
  await initStorage();
  setTimeout(() => popCheck(), 1000);
  // Check for pending recovery notification
  await checkPendingRecoveryNotification();
});

// Alarm listener for periodic checks
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === "popCheck") {
    popCheck();
  }
});

// Message listener for communication with Popup/Options
chrome.runtime.onMessage.addListener((
  request: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  handleMessage(request, sendResponse);
  return true; // Indicates async response
});

async function handleMessage(
  request: unknown,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    // Create services object with all dependencies needed by message handlers
    const services: MessageServices = {
      getSnoozedTabsV2,
      setSnoozedTabs,
      getSettings,
      setSettings,
      snooze,
      removeSnoozedTabWrapper,
      removeWindowGroup,
      restoreWindowGroup,
      importTabs,
      getExportData,
    };

    // Dispatch to appropriate handler using message contract
    const response = await dispatchMessage(request as Parameters<typeof dispatchMessage>[0], services);
    sendResponse(response);
  } catch (error) {
    sendResponse({ error: (error as Error).message });
  }
}

/**
 * Check for pending recovery notification and show it (with deduplication)
 */
async function checkPendingRecoveryNotification(): Promise<void> {
  try {
    // Check if there's a pending notification from initStorage
    const session = await storage.getSession(['pendingRecoveryNotification', 'lastRecoveryNotifiedAt']);

    if (session.pendingRecoveryNotification !== undefined) {
      const tabCount = session.pendingRecoveryNotification as number;
      const now = Date.now();
      const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

      const lastNotified = session.lastRecoveryNotifiedAt as number | undefined;

      // Check if we recently showed a notification
      if (!lastNotified || (now - lastNotified) > NOTIFICATION_COOLDOWN) {
        // Show notification
        await notifications.create('recovery-notification', {
          type: 'basic',
          iconUrl: 'assets/icon128.png',
          title: 'Snooooze Data Recovered',
          message: tabCount > 0
            ? `Recovered ${tabCount} snoozed tab${tabCount > 1 ? 's' : ''} from backup.`
            : 'Snoozed tabs data was reset due to corruption.',
          priority: 1
        });

        // Update timestamp
        await storage.setSession({ lastRecoveryNotifiedAt: now });
      }

      // Clear the pending flag
      await storage.removeSession('pendingRecoveryNotification');
    }
  } catch (e) {
    // Notification failed, but don't crash
    console.warn('Recovery notification failed:', e);
  }
}

// Notification click handler - open Options page
chrome.notifications.onClicked.addListener((notificationId: string) => {
  if (notificationId === 'storage-warning' || notificationId === 'recovery-notification') {
    tabs.create({ url: runtime.getURL('options/index.html') });
  } else if (notificationId === 'restore-failed') {
    // Open Options with showFailedTabs query param to trigger Dialog
    tabs.create({ url: runtime.getURL('options/index.html?showFailedTabs=true') });
  }
});
