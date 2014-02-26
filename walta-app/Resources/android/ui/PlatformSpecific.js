// Keep track of windows we've opened but not closed
var windowStack = [];

function transitionWindows( win, effect ) {
	var args;
	
	windowStack.push( win );
	if ( effect === 'right' ) {
		args = { activityEnterAnimation: Ti.App.Android.R.anim.key_enter_right,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_left };
	} else if ( effect === 'left' ) {
		args = { activityEnterAnimation: Ti.App.Android.R.anim.key_enter_left,
				activityExitAnimation: Ti.App.Android.R.anim.key_exit_right };
	} else {
		args = { animate: false };
	}
	win.addEventListener( 'open', function() { 
		if ( windowStack.length > 1 ) {
			windowStack.shift().close();
		}
	});
	
	win.open( args );
	
}
exports.transitionWindows = transitionWindows;
exports.getLoadingIndicatorStyle = Titanium.UI.ActivityIndicatorStyle.BIG;