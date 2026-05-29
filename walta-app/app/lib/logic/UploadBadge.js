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

  // Badge = samples still needing upload, plus one for "a full sync is
  // recommended" (history not pulled / local changes not reconciled).
  function value() { return pendingCount() + (isRecommended() ? 1 : 0); }

  function refresh() { setBadge(value()); }

  function recommend() { setRecommended(true); refresh(); }
  function clear() { setRecommended(false); refresh(); }

  return {
    value,
    refresh,
    recommend,
    clear,
    onLocalActivity: refresh,  // new/edited sample already shows via the pending count
    onLogout: clear,
    onSyncFinished({ success, fullSync }) {
      if (success && fullSync) setRecommended(false);
      refresh();
    },
  };
}

// Wire a badge to the app's Topics + platform IO. `topics` is the Topics
// module (or a test fake); `requestPermission` is optional (iOS badge
// permission). `checkSyncNeeded` is the WB-114 probe — on login (and any
// other refresh trigger callers wire in), it answers true/false/undefined and
// drives the flag from the answer rather than blindly recommending.
// Refreshes once on startup so a relaunch reflects current state.
function init({ properties, pendingCount, setBadge, topics, checkSyncNeeded, requestPermission }) {
  const badge = createUploadBadge({ properties, pendingCount, setBadge });
  const subs = [];
  function on(topic, fn) { topics.subscribe(topic, fn); subs.push([topic, fn]); }

  function probeAndApply() {
    return Promise.resolve()
      .then(() => checkSyncNeeded && checkSyncNeeded())
      .then((needed) => {
        if (needed === true) badge.recommend();
        else if (needed === false) badge.clear();
        else badge.refresh();   // undefined: leave the flag alone, just sync the badge
      });
  }

  on(topics.LOGGEDIN, probeAndApply);
  on(topics.LOGGEDOUT, () => badge.onLogout());
  on(topics.FORCE_UPLOAD, () => badge.onLocalActivity());
  // A successful full sync authoritatively clears the flag; any other outcome
  // (upload-only, failure) leaves the flag's accuracy uncertain, so reprobe.
  // This piggybacks on the 30-min SampleSync timer — every periodic attempt
  // fires SYNC_FINISHED, which keeps the badge truthful between manual syncs.
  on(topics.SYNC_FINISHED, (e) => {
    const evt = e || {};
    if (evt.success && evt.fullSync) { badge.onSyncFinished(evt); return; }
    return probeAndApply();
  });
  if (requestPermission) requestPermission();
  badge.refresh();
  badge.probe = probeAndApply;
  // Lets a test (or a re-init) drop the Topics subscriptions it added.
  badge.dispose = () => subs.forEach(([t, fn]) => topics.unsubscribe(t, fn));
  return badge;
}

module.exports = { createUploadBadge, init, SYNC_RECOMMENDED_KEY };
