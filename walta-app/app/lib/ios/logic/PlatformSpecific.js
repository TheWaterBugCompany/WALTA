
function appStartUp() {

}

function appShutdown() {

}

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

			win2.transform = Ti.UI.createMatrix2D().translate( tx1, 0 );
			 
			var a1 = Ti.UI.createAnimation({
				transform: Ti.UI.createMatrix2D().translate( tx2, 0 ),
				duration: 200
			});
			var a2 = Ti.UI.createAnimation({
				transform: Ti.UI.createMatrix2D(),
				duration: 200
			});
			win2.open();
			win2.animate( a2 );
			win1.animate( a1, ()=> win1.close() );
		} else {
			win2.open();
			win1.close();
		}
	} else {
		win2.open();
	}


}

function convertSystemToDip( n ) {
	return n;
}

function urlToLocalAsset( path ) {
	if ( path.slice(0,7) === "file://" )
		return path;
	if ( path[0] != '/' ) path = '/' + path;
	return `app://${path}`;
}

exports.urlToLocalAsset = urlToLocalAsset;
exports.appStartUp = appStartUp;
exports.appShutdown = appShutdown;
exports.convertSystemToDip = convertSystemToDip;
exports.convertDipToSystem = convertSystemToDip;
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Ti.UI.ActivityIndicatorStyle.BIG;
