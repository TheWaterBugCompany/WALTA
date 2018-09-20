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

function appStartUp( privates ) {
	// we create root window so that Android doesn't crash when the menu window is closed
	// during transitions.
	privates.rootWindow = Ti.UI.createWindow({
			navBarHidden: true,
			fullscreen: true
	});
	privates.rootWindow.open();
}

function appShutdown( privates ) {
	Titanium.Android.currentActivity.finish();
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
	win.open( args );
	if ( Alloy.Globals.lastWindow )
		Ti.API.info(`window stack: ${Alloy.Globals.lastWindow.map((w)=>w.title)}`);
	if ( Alloy.Globals.lastWindow && Alloy.Globals.lastWindow.length > 1 ) {
		Alloy.Globals.lastWindow.shift().close();
		
	} else {
		Alloy.Globals.lastWindow = [];
	}
	Alloy.Globals.lastWindow.push( win );
}

function convertSystemToDip( n ) {
	return Ti.UI.convertUnits( n + "px", Ti.UI.UNIT_DIP );
}

function urlToLocalAsset( path ) {
	if ( path[0] != '/' ) path = '/' + path;
	return `file:///android_asset/Resources${path}`;
}

exports.urlToLocalAsset = urlToLocalAsset;
exports.appStartUp = appStartUp;
exports.appShutdown = appShutdown;
exports.convertSystemToDip = convertSystemToDip;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.ActivityIndicatorStyle.BIG;
