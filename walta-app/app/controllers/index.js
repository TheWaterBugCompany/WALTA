var CerdiApi = require("logic/CerdiApi");
var KeyLoader = require('logic/KeyLoaderJson');
var GeoLocationService = require('logic/GeoLocationService'); 
var Crashlytics = require('util/Crashlytics');
var Topics = require('ui/Topics');
var SampleSync = require("logic/SampleSync");
var PlatformSpecific = require("ui/PlatformSpecific");
var debug = m => Ti.API.info(m);
Topics.init();

// FIXME: deprecate using globals
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
SampleSync.init();
// Report user name to Crashlytics when logged in
if ( Crashlytics.isAvailable() ) {
    function setUserId() { 
      Crashlytics.setUserId( Ti.App.Properties.getObject('userAccessUsername') ); 
    }
    Topics.subscribe( Topics.LOGGEDIN, (data) => setUserId() );
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
      setUserId();
    }
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

// glue the Main controller to the various
// objects that perform the logic
Alloy.createController("Main", {
    System: {
        requestPermission: function( permissions, done ) {
            if ( OS_ANDROID ) {
                debug('Asking for permissions...');
                Ti.Android.requestPermissions(permissions, done );
            } else {
                done({ success: true });
            }
        },

        closeApp: function() {
            PlatformSpecific.appShutdown();
        }
    },
    View: {
        openView: function(ctl,args) {
            debug(`opening controller="${ctl}" with args.readonly= ${args.readonly}`);
            var controller = Alloy.createController(ctl,args);
            controller.open();
        }
    },
    Key: Alloy.Globals.Key,
    Survey: {
        forceUpload: function() {
            debug("forcing synchronise");
            SampleSync.forceUpload();
        },
        startSurvey: function( surveyType ) {
            Alloy.Collections.instance("sample").startNewSurveyIfComplete(surveyType, Alloy.Globals.CerdiApi.retrieveUserId());
        }
    }

}).startApp(); 