var CerdiApi = require("logic/CerdiApi");
var KeyLoader = require('logic/KeyLoaderJson');
var GeoLocationService = require('logic/GeoLocationService');
var Logger = require('util/Logger');
var log = (m, tag = "navigation") => Logger.log(m, tag);
var Topics = require('ui/Topics');
var SampleSync = require("logic/SampleSync");
var UploadBadge = require("logic/UploadBadge");
var AndroidNotificationBadge = require("logic/AndroidNotificationBadge");
var PlatformSpecific = require("logic/PlatformSpecific");
var UrlActions = require("UrlActions");
var MemoryMonitor = require("util/MemoryMonitor");
var { System } = require("logic/System");
var Dialogs = require("logic/Dialogs");
var { View } = require("logic/View");
var SampleHistorySource = require("logic/SampleHistorySource");
var { Survey } = require("logic/Survey");
var { Navigation } = require('logic/Navigation');
var { checkForErrors } = require('util/PromiseUtils');
var DiagnosticsBundle = require('util/DiagnosticsBundle');
Topics.init();
DiagnosticsBundle.subscribe();

// FIXME: deprecate using globals
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );

// `walta://` URL scheme dispatcher. Acceptance tests use
// `walta://login?email=...&password=...` to bypass the login UI. The dev-only
// actions (`walta://reset` cucumber fast-path WB-67; `walta://ballast?mb=N`
// WB-118 repro knob) are gated by allowDev so a release build can't be wiped
// or memory-ballooned by a stray URL.
var urlActions = UrlActions.create({
  cerdiApi: Alloy.Globals.CerdiApi,
  allowDev: Ti.App.deployType !== 'production',
});
function handleDeeplink(url) {
  log(`[walta-deeplink] dispatch url=${url}`);
  Promise.resolve(urlActions.dispatch(url))
    .catch(function (err) { Logger.recordException(err); });
}
if (OS_IOS) {
  Ti.App.iOS.addEventListener("handleurl", function (e) {
    log(`[walta-deeplink] iOS handleurl fired`);
    handleDeeplink(e.launchOptions && e.launchOptions.url);
  });
} else if (OS_ANDROID) {
  // The intent-filter is on WaterbugActivity (the launcher), so the
  // OS delivers `walta://` intents there — not to whatever TiActivity
  // happens to be foregrounded. With launchMode=singleTask the existing
  // WaterbugActivity gets onNewIntent; rootActivity is our handle to it.
  log(`[walta-deeplink] registering newintent listener on rootActivity`);
  Ti.Android.rootActivity.addEventListener("newintent", function (e) {
    log(`[walta-deeplink] android newintent fired`);
    handleDeeplink(e.intent && e.intent.data);
  });
  // Also handle the case where the app was launched cold via the
  // deeplink (or where we missed the warm-launch event for any reason).
  try {
    var launchData = Ti.Android.rootActivity.intent && Ti.Android.rootActivity.intent.data;
    if (launchData) {
      log(`[walta-deeplink] cold-launch intent data: ${launchData}`);
      handleDeeplink(launchData);
    }
  } catch (e) { /* no rootActivity yet */ }
}

SampleSync.init();

// Log iOS memory warnings (WB-118): the SDK purges proxies on a warning,
// racing in-flight JS proxy creation. Android has no equivalent Ti event.
if (OS_IOS) {
  MemoryMonitor.start(Ti.App);
}

// App-icon "sync recommended" indicator (WB-10). iOS sets the numeric
// appBadge; Android has no numeric badge, so it drives a notification-dot
// via an ongoing notification on a badge-enabled channel (WB-10b).
var androidBadge = OS_ANDROID ? AndroidNotificationBadge.createAndroidBadgeSetter({
  importanceLow: Ti.Android.IMPORTANCE_LOW,
  createChannel: function (spec) { return Ti.Android.NotificationManager.createNotificationChannel(spec); },
  createNotification: function (spec) { return Ti.Android.createNotification(spec); },
  notify: function (id, n) { Ti.Android.NotificationManager.notify(id, n); },
  cancel: function (id) { Ti.Android.NotificationManager.cancel(id); },
}) : null;

UploadBadge.init({
  properties: Ti.App.Properties,
  pendingCount: SampleSync.countSamplesNeedingUpload,
  checkSyncNeeded: SampleSync.checkSyncNeeded,
  setBadge: function (n) {
    if (OS_IOS) Ti.UI.iOS.appBadge = n;
    else if (OS_ANDROID) androidBadge(n);
  },
  topics: Topics,
  // iOS only renders the app-icon badge under full badge authorization —
  // provisional auth grants quietly but never shows the badge (verified on
  // device). So request BADGE, which prompts once. Android 13+ needs the
  // runtime POST_NOTIFICATIONS grant before a notification (hence dot) shows.
  requestPermission: OS_IOS ? function () {
    Ti.App.iOS.registerUserNotificationSettings({ types: [ Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE ] });
  } : (OS_ANDROID ? function () {
    Ti.Android.requestPermissions([ "android.permission.POST_NOTIFICATIONS" ]);
  } : undefined),
});

// Report user name to Logger when logged in
function setUserId() {
  Logger.setUserId( Alloy.Globals.CerdiApi.retrieveUsername() );
}
Topics.subscribe( Topics.LOGGEDIN, (data) => setUserId() );
if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
  setUserId();
}


var keyUrl = Ti.Filesystem.resourcesDirectory + "taxonomy/walta/";

Alloy.Globals.Key = KeyLoader.loadKey(keyUrl);
if ( ! Alloy.Globals.Key  ) {
  throw "Failed to load the key: " + keyUrl;
}

PlatformSpecific.appStartUp();
GeoLocationService.init();

Alloy.Models.instance("sample").loadCurrent();
Alloy.Collections.taxa = Alloy.Models.instance("sample").loadTaxa();
let services ={
  System: System,
  Key: Alloy.Globals.Key,
  Survey: Survey,
  cerdiApi: Alloy.Globals.CerdiApi,
  topics: Topics,
  dialogs: Dialogs,
  platform: PlatformSpecific,
  environment: Alloy.CFG.environment,
  version: Ti.App.version
}

services.sampleSource = SampleHistorySource({ cerdiApi: services.cerdiApi });
services.View = new View(services);
services.Navigation = new Navigation(services);
// Seed the resumed in-progress sample the same way the runtime roots do — the
// bus, now that Navigation is subscribed.
Topics.fireTopicEvent(Topics.SURVEY_STARTED, {
  sample: Alloy.Models.instance("sample"),
  taxa: Alloy.Collections.instance("taxa"),
});
// glue the Main controller to the various
// objects that perform the logic
checkForErrors( Alloy.createController("Main",services).startApp() ); 