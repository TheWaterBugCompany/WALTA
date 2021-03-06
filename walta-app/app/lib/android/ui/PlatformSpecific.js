/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function appStartUp() {
	// Not needed any more
}

function appShutdown( ) {
	Ti.API.debug("Application shutdown");
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
	Ti.API.debug(`Window stack: ${Alloy.Globals.lastWindow.map((w)=>getWindowName(w))}`);
	win.open( args );
	if ( Alloy.Globals.lastWindow.length > 1 ) {
		var oldWindow = Alloy.Globals.lastWindow.shift();
		Ti.API.debug(`oldWindow = ${getWindowName(oldWindow)} `);
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
