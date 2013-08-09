var PubSub = require('lib/pubsub');


var PhotoView = require('ui/PhotoView')
var pv = PhotoView.createPhotoView(
		[ 
			'/ui-test/resources/simpleKey1/media/amphipoda_01.jpg',
			'/ui-test/resources/simpleKey1/media/amphipoda_02.jpg',
			'/ui-test/resources/simpleKey1/media/amphipoda_03.jpg'
		]

);
var win = Ti.UI.createWindow( { 
	backgroundColor: 'white', 
	orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
);
var vw = Ti.UI.createView( { width: '300dip', height: '250dip' })
vw.add(pv);
win.add( vw );
win.addEventListener( 'click',  function(e) { win.close();  e.cancelBubble = true; } );

function run() {
	win.open();
}

exports.run = run;
