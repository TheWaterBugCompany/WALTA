
var Logger = require('util/Logger');

function appStartUp() {
	// Not needed any more
}

function appShutdown( ) {
	Logger.debug("Application shutdown");
	Alloy.Globals.lastWindow.forEach( (w) => w.close() );
	Ti.Android.currentActivity.finish();
}

function getWindowName(w){ 
	if (w.title)
		return w.title;
	else
		return "Menu";
}
 
function transitionWindows( win, effect ) {
	var args = {};
	if ( effect === 'right' ) {
		args.activityEnterAnimation = Ti.App.Android.R.anim.key_enter_right;
		args.activityExitAnimation = Ti.App.Android.R.anim.key_exit_left;
	} else if ( effect === 'left' ) {
		args.activityEnterAnimation = Ti.App.Android.R.anim.key_enter_left;
		args.activityExitAnimation = Ti.App.Android.R.anim.key_exit_right;
	} else {
		args.activityEnterAnimation = Ti.Android.R.anim.fade_in;
		args.activityExitAnimation = Ti.Android.R.anim.fade_out;
	}

	if ( ! Alloy.Globals.lastWindow ) {
		Alloy.Globals.lastWindow = [];
	}

	Alloy.Globals.lastWindow.push( win );
	Logger.debug(`Window stack: ${Alloy.Globals.lastWindow.map((w)=>getWindowName(w))}`);
	win.open( args );
	if ( Alloy.Globals.lastWindow.length > 1 ) {
		var oldWindow = Alloy.Globals.lastWindow.shift();
		Logger.debug(`oldWindow = ${getWindowName(oldWindow)} `);
		oldWindow.close();
	};
}

function convertSystemToDip( n ) {
	return Ti.UI.convertUnits( n + "px", Ti.UI.UNIT_DIP );
}

function convertDipToSystem( n ) {
	return Ti.UI.convertUnits( n + "dp", Ti.UI.UNIT_PX );
}

function urlToLocalAsset( path ) {
	console.debug(`urlToLocalAsset("${path}")`);
	if ( path.slice(0,7) === "file://" )
		return path;
	if ( path[0] != '/' ) path = '/' + path;
	return `file:///android_asset/Resources${path}`;
}

exports.urlToLocalAsset = urlToLocalAsset;
exports.appStartUp = appStartUp;
exports.appShutdown = appShutdown;
exports.convertSystemToDip = convertSystemToDip;
exports.convertDipToSystem = convertDipToSystem;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.ActivityIndicatorStyle.BIG;
