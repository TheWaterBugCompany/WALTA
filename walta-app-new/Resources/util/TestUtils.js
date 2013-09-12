var manualTests = false;
function setManualTests( b ) {
	manualTests = b;
}

function isManualTests() {
	return manualTests;
}

function wrapViewInWindow( view ) {
	var win = Ti.UI.createWindow( { backgroundColor: 'white' } );
	win.add( view );
	return win;
}

exports.wrapViewInWindow = wrapViewInWindow;
exports.setManualTests = setManualTests;
exports.isManualTests = isManualTests;