// Android has no numeric app-icon badge; the equivalent "sync recommended"
// nudge is a notification-dot on the launcher icon, driven by an ongoing
// notification on a badge-enabled channel. See WB-10b.
//
// Ti primitives are injected so the post/cancel + channel-once decision is
// node-testable without the Android runtime.
const CHANNEL_ID = "sync-recommended";
const NOTIFICATION_ID = 1;

function createAndroidBadgeSetter({ importanceLow, createChannel, createNotification, notify, cancel }) {
  let channelReady = false;

  function ensureChannel() {
    if (channelReady) return;
    createChannel({
      id: CHANNEL_ID,
      name: "Sync reminders",
      importance: importanceLow,
      showBadge: true,
    });
    channelReady = true;
  }

  return function setBadge(n) {
    ensureChannel();
    if (n > 0) {
      notify(NOTIFICATION_ID, createNotification({
        channelId: CHANNEL_ID,
        contentTitle: "Waterbug",
        contentText: "Sync recommended",
        number: n,
        ongoing: true,
      }));
    } else {
      cancel(NOTIFICATION_ID);
    }
  };
}

module.exports = { createAndroidBadgeSetter, CHANNEL_ID, NOTIFICATION_ID };
