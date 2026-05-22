// Decides whether the app-icon "sync recommended" indicator should show and
// drives the platform badge. The indicator nudges the user to run a manual
// full sync — uploads are automatic, so the durable signal is "you have
// local activity and/or haven't pulled your historical samples yet". See WB-10.
//
// Pure decision + state, with IO injected (properties / pendingCount /
// setBadge) so it's testable without Ti and reusable across platforms.
const SYNC_RECOMMENDED_KEY = "syncRecommended";

function createUploadBadge({ properties, pendingCount, setBadge }) {
  function isRecommended() { return properties.getBool(SYNC_RECOMMENDED_KEY, false); }
  function setRecommended(value) { properties.setBool(SYNC_RECOMMENDED_KEY, value); }

  function shouldShow() { return isRecommended() || pendingCount() > 0; }

  function refresh() { setBadge(shouldShow() ? 1 : 0); }

  function recommend() { setRecommended(true); refresh(); }
  function clear() { setRecommended(false); refresh(); }

  return {
    shouldShow,
    refresh,
    onLogin: recommend,          // history not yet pulled this session
    onLocalActivity: recommend,  // new/edited sample needs reconciling
    onLogout: clear,
    onSyncFinished({ success, fullSync }) {
      if (success && fullSync) setRecommended(false);
      refresh();
    },
  };
}

// Wire a badge to the app's Topics + platform IO. `topics` is the Topics
// module (or a test fake); `requestPermission` is optional (iOS badge
// permission). Refreshes once on startup so a relaunch reflects current state.
function init({ properties, pendingCount, setBadge, topics, requestPermission }) {
  const badge = createUploadBadge({ properties, pendingCount, setBadge });
  const subs = [];
  function on(topic, fn) { topics.subscribe(topic, fn); subs.push([topic, fn]); }
  on(topics.LOGGEDIN, () => badge.onLogin());
  on(topics.LOGGEDOUT, () => badge.onLogout());
  on(topics.FORCE_UPLOAD, () => badge.onLocalActivity());
  on(topics.SYNC_FINISHED, (e) => badge.onSyncFinished(e || {}));
  if (requestPermission) requestPermission();
  badge.refresh();
  // Lets a test (or a re-init) drop the Topics subscriptions it added.
  badge.dispose = () => subs.forEach(([t, fn]) => topics.unsubscribe(t, fn));
  return badge;
}

module.exports = { createUploadBadge, init, SYNC_RECOMMENDED_KEY };
