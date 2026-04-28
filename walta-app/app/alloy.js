
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
if (OS_ANDROID) {
    try {
        var intent = Ti.Android.currentActivity.intent;
        var urlOverride = intent.getStringExtra("cerdiServerUrlOverride");
        var secretOverride = intent.getStringExtra("cerdiApiSecretOverride");
        if (urlOverride)    Alloy.CFG.cerdiServerUrl = urlOverride;
        if (secretOverride) Alloy.CFG.cerdiApiSecret = secretOverride;
    } catch (e) { /* no activity yet */ }
} else if (OS_IOS) {
    var iosArgs = Ti.App.arguments || [];
    var urlIdx = iosArgs.indexOf("--cerdiServerUrl");
    var secretIdx = iosArgs.indexOf("--cerdiApiSecret");
    if (urlIdx    >= 0 && iosArgs[urlIdx + 1])    Alloy.CFG.cerdiServerUrl  = iosArgs[urlIdx + 1];
    if (secretIdx >= 0 && iosArgs[secretIdx + 1]) Alloy.CFG.cerdiApiSecret = iosArgs[secretIdx + 1];
}


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
