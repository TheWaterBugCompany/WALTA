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

// Keep track of windows we've opened but not closed
var windowStack = [];

function transitionWindows( win, effect ) {
	var args = {
		//navBarHidden: true,
		//fullscreen: true,
		//modal: true
	};
	
	//windowStack.push( win );
	/*if ( effect === 'right' ) {
		args.activityEnterAnimation = Ti.App.Android.R.anim.key_enter_right,
		args.activityExitAnimation = Ti.App.Android.R.anim.key_exit_left;
	} else if ( effect === 'left' ) {
		args.activityEnterAnimation = Ti.App.Android.R.anim.key_enter_left,
		args.activityExitAnimation = Ti.App.Android.R.anim.key_exit_right;
	} */
	/*win.addEventListener( 'focus', function() { 
		if ( windowStack.length > 1 ) {
			windowStack.shift().close( {animated: false });
		}
	});*/
	
	win.open( args );
	
}
function convertSystemToDip( n ) {
	return Ti.UI.convertUnits( n + "px", Ti.UI.UNIT_DIP );
}

exports.convertSystemToDip = convertSystemToDip;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.ActivityIndicatorStyle.BIG;