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

var oldWin = null;
var oldAnchorBar = null;
function makeAnchorBarStationary( win, anchorBar ) {
	/* if ( Ti.Platform.Android.API_LEVEL >= 21 ) {
		if ( oldAnchorBar != null ) {
		  win.addSharedElement( oldAnchorBar.view, 'anchorBar' );
		}
		oldAnchorBar = anchorBar;
	} */
}

function preCreateTopLevelWindow( winArgs, args ) {
	/*if ( Ti.Platform.Android.API_LEVEL >= 21 ) {
		if ( args.slide === 'right' ) {
			winArgs.activityEnterTransition = Ti.App.Android.R.anim.key_enter_right;
			winArgs.activityExitTransition = Ti.App.Android.R.anim.key_exit_left;
		} else if ( args.slide === 'left' ) {
			winArgs.activityEnterTransition = Ti.App.Android.R.anim.key_enter_left;
			winArgs.activityExitTransition = Ti.App.Android.R.anim.key_exit_right;
		} else {
			winArgs.activityEnterTransition = Ti.UI.Android.TRANSITION_FADE_IN;
			winArgs.activityExitTransition = Ti.UI.Android.TRANSITION_FADE_OUT;
		}
	} */
}

function transitionWindows( win, effect ) {
	var args = {};
	
	//if ( Ti.Platform.Android.API_LEVEL < 21 ) {
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
	//}
	 
	// close old window when this new window is pausing to avoid memory leak...
	if ( oldWin != null )
		win.activity.onPause = function(win2) { return function() { win2.close(); }; } (oldWin);  
	
	win.open( args );
	oldWin = win;
	
}
function convertSystemToDip( n ) {
	return Ti.UI.convertUnits( n + "px", Ti.UI.UNIT_DIP );
}

exports.convertSystemToDip = convertSystemToDip;
exports.makeAnchorBarStationary = makeAnchorBarStationary;
exports.preCreateTopLevelWindow = preCreateTopLevelWindow;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.ActivityIndicatorStyle.BIG;