var PubSub = require('lib/pubsub');


var AnchorBar = require('ui/AnchorBar');
var acb = AnchorBar.createAnchorBar();
var win = Ti.UI.createWindow( { backgroundColor: 'white', orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } );
win.add(acb.view);

PubSub.subscribe( AnchorBar.topics.HOME, function() { alert("Home pressed" ); } );
PubSub.subscribe( AnchorBar.topics.SETTINGS, function() { alert("Settings pressed" ); } );
PubSub.subscribe( AnchorBar.topics.INFO, function() { alert("Info pressed" ); } );

win.addEventListener( 'click',  function(e) { win.close(); } );

function run() {
	win.open();
}

exports.run = run;
