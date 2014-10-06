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
	var tx1, tx2;
	
	windowStack.push( win ); // remember new window
	
	var win1;
	var win2 = win;
	
	// We can only transition if we have a reference to the
	// previous window
	if ( windowStack.length > 1 ) {
		win1 = windowStack.shift();  // get previous window
		
		if (effect === 'left' || effect === 'right' ) {
			if ( effect === 'right' ) {
				tx1 = win1.size.width;
				tx2 = -tx1; 
			} else {
				tx2 = win1.size.width;
				tx1 = -tx2;	
			}
			
			win2.setTransform( Ti.UI.create2DMatrix().translate( tx1, 0 ) );
			win2.open(); // Open window first: opening a window is a heavy operation
			             // so we open it early to make sure it is ready to be
			             // animated instantly in the following code.
			var a1 = Ti.UI.createAnimation({ 
				transform: Ti.UI.create2DMatrix().translate( tx2, 0 ),
				duration: 400
			});
			var a2 = Ti.UI.createAnimation({
				transform: Ti.UI.create2DMatrix(),
				duration: 400
			});
			win2.animate( a2 ); 
			win1.close( a1 );
		} else {
			win2.open( {animate: false} );
			win1.close( {animate: false} );
		}
	} else {
		win2.open();
	}


}

function convertSystemToDip( n ) {
	return n;
}

exports.convertSystemToDip = convertSystemToDip;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG;