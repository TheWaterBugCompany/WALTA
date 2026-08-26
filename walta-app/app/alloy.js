
/*
 * Bootstrap the application
 */

const Logger = require('util/Logger');
var log = (m, tag = "sample") => Logger.log(m, tag);
var debug = (m, tag = "sample") => Logger.debug(m, tag);

const appConfig = Ti.Filesystem.getFile("app-config.json").read();
_.extend(Alloy.CFG, JSON.parse(appConfig));

// Runtime override for cerdiServerUrl — lets acceptance tests redirect
// API traffic to a mock without rebuilding. Android: intent extra
// from `am start --es cerdiServerUrl <url>`. iOS: process arg
// `--cerdiServerUrl <url>` passed via Appium processArguments.
var serverUrl = null;
var apiSecret = null;

if (OS_ANDROID) {
    try {
        var intent = Ti.Android.currentActivity.intent;
        serverUrl = intent.getStringExtra("cerdiServerUrl");
        apiSecret = intent.getStringExtra("cerdiApiSecret");
        // Persist test launchargs so subsequent cold-launches recover them.
        // `mobile: deepLink` (used by acceptance tests for walta://reset)
        // restarts the activity with only the URI in the intent — no extras.
        // Without this, alloy.js would fall back to the production sandbox
        // URL and login would never reach the mock. Guarded on deployType
        // so release builds never write these (and a release install never
        // carries the extras anyway, so reads stay null).
        if (Ti.App.deployType !== 'production') {
            if (serverUrl) Ti.App.Properties.setString("cerdiServerUrl", serverUrl);
            if (apiSecret) Ti.App.Properties.setString("cerdiApiSecret", apiSecret);
            if (!serverUrl) serverUrl = Ti.App.Properties.getString("cerdiServerUrl");
            if (!apiSecret) apiSecret = Ti.App.Properties.getString("cerdiApiSecret");
        }
        Ti.API.debug(`[walta-launchargs] android intent.data=${intent.data} cerdiServerUrl=${serverUrl}`);
    } catch (e) {
        Ti.API.debug(`[walta-launchargs] android intent read failed: ${e && e.message}`);
    }
} else if (OS_IOS) {
    // iOS auto-merges launch argv `-key value` pairs into NSUserDefaults,
    // which Ti.App.Properties is the bridge to. See spec/index.js for
    // the same pattern used by the unit-test runner.
    serverUrl = Ti.App.Properties.getString("cerdiServerUrl");
    apiSecret = Ti.App.Properties.getString("cerdiApiSecret");
    Ti.API.debug(`[walta-launchargs] ios cerdiServerUrl=${serverUrl}`);
}

if (serverUrl) Alloy.CFG.cerdiServerUrl = serverUrl;
if (apiSecret) Alloy.CFG.cerdiApiSecret = apiSecret;
Ti.API.debug(`[walta-launchargs] final Alloy.CFG.cerdiServerUrl=${Alloy.CFG.cerdiServerUrl}`);


// Apply pending migrations for the non-Alloy log persistence db
// before any repository's `open()` runs. The runner discovers every
// migration file in repository/migrations/ and applies each
// against this db.
require("repository/Migrator").migrate("waterbug_data");

Logger.configure();
Logger.setCustomKey("deploy.type", Ti.App.deployType );

Ti.App.addEventListener( "uncaughtException", function(e) {
    Logger.recordException( e );
});

Alloy.Events = _.clone(Backbone.Events);
Alloy.Globals.Key = null;

debug("Determining device screen parameters...")
log(`platform display caps: width = ${Ti.Platform.displayCaps.platformWidth}, height = ${Ti.Platform.displayCaps.platformHeight}, density = ${Ti.Platform.displayCaps.density}, logicalDensityFactor  = ${Ti.Platform.displayCaps.logicalDensityFactor},`);

var screen = require("util/screenMetrics")(Ti.Platform.displayCaps, Ti.Platform.osname);

log(`relWidth=${screen.relWidth}, relHeight=${screen.relHeight}, aspectRatio=${screen.aspectRatio}`);

Alloy.Globals.isSquare = screen.isSquare;

Alloy.Globals.isLowRes = screen.isLowRes;
Alloy.Globals.isHighRes = screen.isHighRes;
Alloy.Globals.isXHighRes = screen.isXHighRes;

log(`isSquare=${Alloy.Globals.isSquare}, isLowRes=${Alloy.Globals.isLowRes}, isHighRes=${Alloy.Globals.isHighRes}, isXHighRes=${Alloy.Globals.isXHighRes}`);
