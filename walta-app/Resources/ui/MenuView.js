/*
 * Module: MenuView
 * 
 * Provides the main menu screen.
 */

var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

// Create a menu button
function createLargeMenuButton( image, topic, label, text ) {

	var btn = wrap( 'horizontal', [
		icon({
			width: Layout.MENU_ICON_WIDTH,
			height: Layout.MENU_ICON_HEIGHT,
			image: image
		}),
		_(wrap( 'vertical',[
			Ti.UI.createLabel({
				left: 0,
				width: Ti.UI.FILL,
				height: Ti.UI.SIZE,
				text: label,
				font: { fontFamily: 'Boulder', fontSize: Layout.MENU_LARGE_BUTTON_HEADING_FONT_SIZE },
				color: '#882F61CC'
			}),
			Ti.UI.createLabel({
				left: 0,
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				text: text,
				font: { fontFamily: 'Tahoma', fontSize: Layout.MENU_LARGE_BUTTON_TEXT_FONT_SIZE },
				color: 'black'
			})]
		)).extend( { width: Ti.UI.FILL, height: Ti.UI.FILL })
	]);
	btn.addEventListener( 'click', function(e) {
		PubSub.publish( topic, null );
		e.cancelBubble = true;
	});
	return _(btn).extend( { 
			top: Layout.MENU_GAP,
			left: Layout.MENU_GAP,
			width: Layout.MENU_ITEM_WIDTH_2,
			height: Layout.MENU_ITEM_HEIGHT,
			borderRadius: Layout.BORDER_RADIUS_MENU_BIG,
			backgroundColor: '#552F61CC'
		} );
}

function createSmallMenuButton( topic, label, text ) {
	var btn = 
			wrap( 'vertical',[
				Ti.UI.createLabel({
					left: Layout.WHITESPACE_GAP,
					width: Ti.UI.FILL,
					height: Ti.UI.SIZE,
					text: label,
					font: { fontFamily: 'Boulder', fontSize: '20dip' },
					color: '#882F61CC'
				}),
				Ti.UI.createLabel({
					left: Layout.WHITESPACE_GAP,
					width: Ti.UI.FILL,
					height: Ti.UI.SIZE,
					text: text,
					font: { fontFamily: 'Tahoma', fontSize: '14dip' },
					color: 'black'
				}) 
		]);
	btn.addEventListener( 'click', function(e) {
		PubSub.publish( topic, null );
		e.cancelBubble = true;
	});
	return _(btn).extend( { 
			top: Layout.MENU_GAP,
			left: Layout.MENU_GAP,
			width: Layout.MENU_ITEM_WIDTH_2,
			height: Layout.MENU_ITEM_HEIGHT,
			borderRadius: Layout.BORDER_RADIUS_MENU_SMALL,
			backgroundColor: '#552F61CC'
		} );
}

function wrap( dir, views ) {
	var wrp = Ti.UI.createView({
		layout: dir,
		width: ( dir == 'horizontal' ? Ti.UI.FILL : Ti.UI.SIZE ),
		height: ( dir == 'vertical' ? Ti.UI.FILL : Ti.UI.SIZE )
	});
	_(views).each( function(v) { wrp.add(v); });
	return wrp;
}

function icon( args ) {
	var ic = Ti.UI.createImageView(
		args	
	);
	var cnt = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.FILL
	});
	cnt.add( ic );
	return cnt;
}

function createMenuView() {
	
	var Layout = require('ui/Layout');
	
	var menu = {};
	menu._views = {};
	var vws = menu._views;
	
	menu.view = Ti.UI.createView({
   		width: Ti.UI.FILL,
   		height: Ti.UI.FILL,
   		background: 'white',
   		layout: 'vertical'
	});
	
	vws.logo = _(wrap( 'horizontal',[
			_(wrap( 'vertical',[
				_(icon({
					top: Layout.MENU_LOGO_TOP,
					width: Layout.MENU_LOGO_WIDTH,
					height: Layout.MENU_LOGO_HEIGHT,
					image: '/images/logo.png'
				})).extend( { height: Ti.UI.SIZE } ),
				Ti.UI.createLabel({
					top: '1dip',
					width: Ti.UI.SIZE,
					height: Ti.UI.SIZE,
					text: 'The Waterbug Company',
					font: { fontFamily: 'Tahoma', fontSize: Layout.MENU_LOGO_FONT_SIZE },
					color: '#882F61CC'
				})
			])).extend( { 
				width: Layout.MENU_LOGO_LEFT,
				height: Ti.UI.FILL
			}),
			Ti.UI.createLabel({
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				text: 'The Waterbug App',
				font: { fontFamily: 'Boulder', fontSize: Layout.MENU_TITLE_FONT_SIZE },
				color: 'black'
			})
	])).extend( {
			left: Layout.MENU_GAP,
			height: Layout.MENU_ITEM_HEIGHT,
			width: Ti.UI.FILL
		});
		
	vws.speedbug = createLargeMenuButton( 
		'/images/speedbug.png', 
		Topics.SPEEDBUG, 
		'Speedbug', 
		'Look at silhouettes of bugs to choose the best match.' 
	);
	
	vws.keysearch = createLargeMenuButton( 
		'/images/altkey.png', 
		Topics.KEYSEARCH, 
		'ALT key', 
		'Questions to help identify your waterbug.' 
	);
	
	vws.browse = createLargeMenuButton( 
		'/images/browse.png', 
		Topics.BROWSE, 
		'Browse list', 
		'If you know the name of your bug.' 
	);
	
	vws.help = createLargeMenuButton( 
		'/images/help.png',
		Topics.HELP, 
		'Help', 
		'Info to get you started.' 
	);
	
	vws.gallery = createLargeMenuButton( 
		'/images/gallery.png',
		Topics.GALLERY, 
		'Gallery', 
		'Browse photos & videos.' 
	);
	
	vws.about = createLargeMenuButton( 
		'/images/about.png',
		Topics.ABOUT, 
		'About', 
		'About the app.' 
	);
	menu.view.add( wrap( 'horizontal', [  
		vws.logo, vws.speedbug, vws.keysearch, vws.browse, 
		vws.gallery, vws.help,  vws.about
	]));
	
	return menu;
};

exports.createMenuView = createMenuView;