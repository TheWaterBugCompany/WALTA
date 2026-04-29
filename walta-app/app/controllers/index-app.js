var CerdiApi = require("logic/CerdiApi");
var KeyLoader = require('logic/KeyLoaderJson');
var GeoLocationService = require('logic/GeoLocationService');
var Logger = require('util/Logger');
var Topics = require('ui/Topics');
var SampleSync = require("logic/SampleSync");
var PlatformSpecific = require("logic/PlatformSpecific");
var UrlActions = require("UrlActions");
var { System } = require("logic/System");
var { View } = require("logic/View");
var { Survey } = require("logic/Survey");
var { Navigation } = require('logic/Navigation');
var { checkForErrors } = require('util/PromiseUtils');
Topics.init();

// FIXME: deprecate using globals
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );

// `walta://` URL scheme dispatcher — see UrlActions.js for the action
// registry. Acceptance tests use `walta://login?email=...&password=...`
// to bypass the login UI; the same surface is available in production.
var urlActions = UrlActions.create({
  cerdiApi: Alloy.Globals.CerdiApi,
  onLoggedIn: function () { Topics.fireTopicEvent(Topics.LOGGEDIN); },
});
function handleDeeplink(url) {
  Logger.log(`[walta-deeplink] dispatch url=${url}`);
  Promise.resolve(urlActions.dispatch(url))
    .catch(function (err) { Logger.recordException(err); });
}
if (OS_IOS) {
  Ti.App.iOS.addEventListener("handleurl", function (e) {
    Logger.log(`[walta-deeplink] iOS handleurl fired`);
    handleDeeplink(e.launchOptions && e.launchOptions.url);
  });
} else if (OS_ANDROID) {
  // The intent-filter is on WaterbugActivity (the launcher), so the
  // OS delivers `walta://` intents there — not to whatever TiActivity
  // happens to be foregrounded. With launchMode=singleTask the existing
  // WaterbugActivity gets onNewIntent; rootActivity is our handle to it.
  Logger.log(`[walta-deeplink] registering newintent listener on rootActivity`);
  Ti.Android.rootActivity.addEventListener("newintent", function (e) {
    Logger.log(`[walta-deeplink] android newintent fired`);
    handleDeeplink(e.intent && e.intent.data);
  });
  // Also handle the case where the app was launched cold via the
  // deeplink (or where we missed the warm-launch event for any reason).
  try {
    var launchData = Ti.Android.rootActivity.intent && Ti.Android.rootActivity.intent.data;
    if (launchData) {
      Logger.log(`[walta-deeplink] cold-launch intent data: ${launchData}`);
      handleDeeplink(launchData);
    }
  } catch (e) { /* no rootActivity yet */ }
}

SampleSync.init();

// Report user name to Logger when logged in
function setUserId() { 
  Logger.setUserId( Ti.App.Properties.getObject('userAccessUsername') ); 
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
  Survey: Survey
}

services.View = new View(services);
services.Navigation = new Navigation(services);
// glue the Main controller to the various
// objects that perform the logic
checkForErrors( Alloy.createController("Main",services).startApp() ); 