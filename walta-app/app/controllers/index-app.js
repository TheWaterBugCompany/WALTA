var CerdiApi = require("logic/CerdiApi");
var KeyLoader = require('logic/KeyLoaderJson');
var GeoLocationService = require('logic/GeoLocationService'); 
var Logger = require('util/Logger');
var Topics = require('ui/Topics');
var SampleSync = require("logic/SampleSync");
var PlatformSpecific = require("logic/PlatformSpecific");
var { System } = require("logic/System");
var { View } = require("logic/View");
var { Survey } = require("logic/Survey");
var { Navigation } = require('logic/Navigation');
var { checkForErrors } = require('util/PromiseUtils');
Topics.init();

// FIXME: deprecate using globals
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );

// Auto-login from launch args — used by acceptance tests to skip the
// login UI flow (and iOS's "Save Password?" sheet that races with it).
// Production builds don't pass these args so this is a no-op.
if (Alloy.CFG.userEmail && Alloy.CFG.userPassword) {
  Alloy.Globals.CerdiApi.loginUser(Alloy.CFG.userEmail, Alloy.CFG.userPassword)
    .then(() => Topics.fireTopicEvent(Topics.LOGGEDIN))
    .catch((e) => Logger.recordException(e));
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