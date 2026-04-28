
/*
 * Bootstrap the application
 */

const Logger = require('util/Logger');
var log = Logger.log;
var debug = m => Logger.debug(m);

const appConfig = Ti.Filesystem.getFile("app-config.json").read();
_.extend(Alloy.CFG, JSON.parse(appConfig));

// Runtime override for cerdiServerUrl — lets acceptance tests redirect
// API traffic to a mock without rebuilding. Android: intent extra
// from `am start --es cerdiServerUrlOverride <url>`. iOS: process arg
// `--cerdiServerUrl <url>` passed via Appium processArguments.
var serverUrl = null;
var apiSecret = null;
var userEmail = null;
var userPassword = null;

if (OS_ANDROID) {
    try {
        var intent = Ti.Android.currentActivity.intent;
        serverUrl    = intent.getStringExtra("cerdiServerUrl");
        apiSecret    = intent.getStringExtra("cerdiApiSecret");
        userEmail    = intent.getStringExtra("userEmail");
        userPassword = intent.getStringExtra("userPassword");
    } catch (e) { /* no activity yet */ }
} else if (OS_IOS) {
    // iOS auto-merges launch argv `-key value` pairs into NSUserDefaults,
    // which Ti.App.Properties is the bridge to. See spec/index.js for
    // the same pattern used by the unit-test runner.
    serverUrl    = Ti.App.Properties.getString("cerdiServerUrl");
    apiSecret    = Ti.App.Properties.getString("cerdiApiSecret");
    userEmail    = Ti.App.Properties.getString("userEmail");
    userPassword = Ti.App.Properties.getString("userPassword");
}

if (serverUrl) Alloy.CFG.cerdiServerUrl = serverUrl;
if (apiSecret) Alloy.CFG.cerdiApiSecret = apiSecret;
// Acceptance tests pass these to trigger an auto-login at app boot —
// see index-app.js for the loginUser call. Bypasses the login UI
// (and iOS's "Save Password?" sheet) entirely.
if (userEmail)    Alloy.CFG.userEmail    = userEmail;
if (userPassword) Alloy.CFG.userPassword = userPassword;


Logger.configure();
Logger.setCustomKey("deploy.type", Ti.App.deployType );

Ti.App.addEventListener( "uncaughtException", function(e) {
    Logger.recordException( e );
});

Alloy.Events = _.clone(Backbone.Events);
Alloy.Globals.Key = null;

debug("Determining device screen parameters...")
log(`platform display caps: width = ${Ti.Platform.displayCaps.platformWidth}, height = ${Ti.Platform.displayCaps.platformHeight}, density = ${Ti.Platform.displayCaps.density}, logicalDensityFactor  = ${Ti.Platform.displayCaps.logicalDensityFactor},`);

var relWidth = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor;
var relHeight= Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor;

if ( relHeight > relWidth ) {
  debug(`Ugh we got portrait sized dimensions width = ${relWidth} height = ${relHeight} :-( swapping...`)
    var tmp = relHeight;
    relHeight = relWidth;
    relWidth = tmp;    
    // we are reporting protrait mode
}

var aspectRatio = relWidth/relHeight; 
 
log(`relWidth=${relWidth}, relHeight=${relHeight}, aspectRatio=${aspectRatio}`);

Alloy.Globals.isSquare = aspectRatio < 1.5;

Alloy.Globals.isLowRes = relHeight < 300; 
Alloy.Globals.isHighRes = (relHeight >= 300) && (relHeight < 700);
Alloy.Globals.isXHighRes=  relHeight >= 700;

log(`isSquare=${Alloy.Globals.isSquare}, isLowRes=${Alloy.Globals.isLowRes}, isHighRes=${Alloy.Globals.isHighRes}, isXHighRes=${Alloy.Globals.isXHighRes}`);
