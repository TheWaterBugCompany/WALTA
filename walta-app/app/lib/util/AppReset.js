// Brings the running app back to a clean per-scenario state without a
// process restart. Triggered by the `walta://reset` deeplink action,
// which is itself only registered in non-production builds — see
// controllers/index-app.js. Used by features/support/cucumber.js to
// replace the slow per-scenario `terminateApp + launch + poll` cycle
// (WB-67).

const Topics = require('ui/Topics');
const SampleSync = require('logic/SampleSync');

async function reset() {
  // Cancel any in-flight sync and wait for it to actually stop *before*
  // dropping the token: otherwise a straddling sync's next API call fails
  // with "Not logged in", stranding a half-downloaded sample that leaks into
  // the next scenario. We cancel directly rather than via LOGGEDOUT so the
  // menu doesn't flip to its logged-out state until reset has finished —
  // that lets the harness poll the logged-out menu as a reliable
  // "reset complete" signal (features/support/appium-world.js).
  SampleSync.cancel();
  await SampleSync.whenQuiesced();

  // Drop the persistent user/app tokens so the next scenario starts
  // unauthenticated. CerdiApi.storeUserToken handles userAccessUsername +
  // userAccessTokenLive; appAccessTokenLive is a separate key.
  Alloy.Globals.CerdiApi.storeUserToken(null, null);
  Ti.App.Properties.removeProperty('appAccessTokenLive');

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

  // Announce the logout last — now that the token is cleared, this flips the
  // menu to its logged-out state (the harness's reset-complete signal) and
  // clears the sync-recommended badge. Topics.HOME → openController("Menu")
  // (see Main.js) truncates history and fires PAGES_UNLOADED so intermediate
  // controllers clean themselves up.
  Topics.fireTopicEvent(Topics.LOGGEDOUT, null);
  Topics.fireTopicEvent(Topics.HOME);
}

exports.reset = reset;
