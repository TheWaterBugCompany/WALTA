// Brings the running app back to a clean per-scenario state without a
// process restart. Triggered by the `walta://reset` deeplink action,
// which is itself only registered in non-production builds — see
// controllers/index-app.js. Used by features/support/cucumber.js to
// replace the slow per-scenario `terminateApp + launch + poll` cycle
// (WB-67).

const Topics = require('ui/Topics');

function reset() {
  // Logout — drop the persistent user/app tokens so the next scenario
  // starts unauthenticated. CerdiApi.storeUserToken handles
  // userAccessUsername + userAccessTokenLive; appAccessTokenLive is a
  // separate key.
  Alloy.Globals.CerdiApi.storeUserToken(null, null);
  Ti.App.Properties.removeProperty('appAccessTokenLive');

  // Reset is a logout, so announce it — SampleSync cancels any in-flight
  // sync started against the now-cleared token (WB-103), mirroring the
  // real logout path in Menu.js.
  Topics.fireTopicEvent(Topics.LOGGEDOUT, null);

  // Wipe the local sample/taxa tables. Same DELETE pattern as
  // walta-app/app/spec/util/TestUtils.clearDatabase.
  const db = Ti.Database.open('samples');
  db.execute('DELETE FROM sample');
  db.execute('DELETE FROM taxa');
  db.close();

  // Re-instantiate Alloy.Models / Collections so in-memory caches don't
  // leak across scenarios.
  Alloy.Models.sample = null;
  Alloy.Models.taxa = null;
  Alloy.Collections.sample = null;
  Alloy.Collections.taxa = null;
  Alloy.Collections.instance('sample');
  Alloy.Collections.instance('taxa');
  Alloy.Models.instance('sample');
  Alloy.Models.instance('taxa');

  // Topics.HOME → Navigation.openController("Menu") (see Main.js). The
  // navigation logic truncates the history and fires PAGES_UNLOADED so
  // intermediate controllers clean themselves up.
  Topics.fireTopicEvent(Topics.HOME);
}

exports.reset = reset;
