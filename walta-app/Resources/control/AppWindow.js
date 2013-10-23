/*
 * Module: AppWindow
 * 
 * This is really the controller in a "MVC"-ish pattern.
 * TODO: Worthwhile converting app to alloy ??
 * 
 */
var _ = require('lib/underscore')._;

var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');

var Topics = require('ui/Topics');

var KeyLoader = require('logic/KeyLoaderXml');
var AnchorBar = require('ui/AnchorBar');
var MenuView = require('ui/MenuView');
var TaxonView = require('ui/TaxonView');
var KeyView = require('ui/KeyView');
var VideoView = require('ui/VideoView');
var BrowseView = require('ui/BrowseView');
var SpeedbugView = require('ui/SpeedbugView');


function iPhone_Slide( win1, win2, dir ) {
	var tx1, tx2;
	
	if ( dir == 'right' ) {
		tx1 = win1.size.width;
		tx2 = -tx1; 
	} else {
		tx2 = win1.size.width;
		tx1 = -tx2;	
	}
	
	win2.setTransform( Ti.UI.create2DMatrix().translate( tx1, 0 ) );
	win2.open(); // Open window first
	var a1 = Ti.UI.createAnimation({ 
		transform: Ti.UI.create2DMatrix().translate( tx2, 0 ),
		duration: 300
	});
	var a2 = Ti.UI.createAnimation({
		transform: Ti.UI.create2DMatrix(),
		duration: 300
	});
	win1.close( a1 );
    win2.animate( a2 ); 
}

function createAppWindow( keyUrl ) {
	if ( ! keyUrl ) {
		throw "Must provide a keyUrl argument";
	} 
	
	// Private variables that are not to be exposed as API
	var privates = {
		key: null,
		//windows: {},
		currentWindow: null,
		callbacks: [],
		
		// Load the key
		loadKey: function( url ) {
			this.key = KeyLoader.loadKey( url );
			if ( ! this.key ) {
				throw "Failed to load the key: " + url;
			}
		},
		
		/* 
		 * All UI objects by convention return a Ti.UI.View 
		 * as the parameter view. This function wraps the view
		 * in a window and adds an AnchorBar to the top. 
		 */
		makeTopLevelWindow: function ( args ) {
			var oModes;
			if ( args.portrait ) {
				oModes = [ Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT ]; 
			} else if ( args.swivel ) {
				oModes = [ Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT, Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT ];
			} else {
				oModes = [ Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT ];
			}
			var win = Ti.UI.createWindow( { 
				navBarHidden: true, // necessary for Android to support orientationModes by forcing heavy weight windows
				fullscreen: true,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				backgroundColor: 'white',
				layout: 'vertical',
				orientationModes:  oModes
			});
			
			if ( args.title ) {
				win.add( AnchorBar.createAnchorBar( args.title ).view );
			}
			
			win.add( _(args.uiObj.view).extend( { 
				width: Ti.UI.FILL, 
				height: Ti.UI.FILL 
			}));
		
			
			// Transition the windows
			if ( args.slide == 'right' ) {
				if ( Ti.Platform.osname === 'android') {
					win.open({
						activityEnterAnimation: Ti.App.Android.R.anim.key_enter_right,
						activityExitAnimation: Ti.App.Android.R.anim.key_exit_left
					});
				} else {
					iPhone_Slide( this.currentWindow, win, args.slide );
				}
			} else if ( args.slide == 'left' ) {
				if ( Ti.Platform.osname === 'android') {
					win.open({
						activityEnterAnimation: Ti.App.Android.R.anim.key_enter_left,
						activityExitAnimation: Ti.App.Android.R.anim.key_exit_right
					});
					
				} else {
					iPhone_Slide( this.currentWindow, win, args.slide );
				}
			} else {
				win.open();
			}
			
			if ( Ti.Platform.osname === 'android' && this.currentWindow ) {
				var cwin = this.currentWindow;
				setTimeout( function() { cwin.close(); }, 400 );
			}
			
			this.currentWindow = win;
		},
		
		menuWindow: function() {
			this.makeTopLevelWindow({
				name: 'home',
				uiObj: MenuView.createMenuView(),
				portrait: true
			});
		},
		
		browseWindow: function() {
			this.makeTopLevelWindow({
				name: 'browse',
				title: 'Browse',
				uiObj: BrowseView.createBrowseView(privates.key),
				swivel: true
			});	
		},
		
		speedBugWindow: function() {
			this.makeTopLevelWindow({
				name: 'speedbug',
				title: 'Speedbug',
				uiObj: SpeedbugView.createSpeedbugView(privates.key)
			});	
		},
		
		updateDecisionWindow: function( backwards ) {
			var node = this.key.getCurrentNode();
			var slideDir = ( backwards ? 'left' : 'right');
			
			// KeyView when on a decision point
			// but TaxonView when on a leaf node
			if ( this.key.isNode( node ) ) {
				this.makeTopLevelWindow( {
					name: 'decision',
					title: 'ALT Key',
					uiObj: KeyView.createKeyView( node ),
					slide: slideDir
				});
			} else {
				this.makeTopLevelWindow( {
					name: 'decision',
					title: 'ALT Key',
					uiObj: TaxonView.createTaxonView( node ),
					slide: slideDir
				});
			}
		},
		
		subscribe: function( topic, cb ) {
			this.callbacks.push( PubSub.subscribe( topic, cb )  );
		},
		
		cleanUp: function() {
			_(this.windows).each( function(w) {
				w.win.close();
			});	
			_(this.callbacks).each(function(cb) {
				PubSub.unsubscribe( cb );
			});
			this.windows = null;
			this.currentWindow = null;
			this.key = null;
		}
	};
	
	var appWin = { keyUrl: keyUrl };
	
	privates.loadKey( appWin.keyUrl );

	privates.subscribe( Topics.HOME, function() { privates.menuWindow();  } );
	
    privates.subscribe( Topics.KEYSEARCH, function() { 
    	privates.key.reset();
    	privates.updateDecisionWindow( false );
    });
    
    privates.subscribe( Topics.BACK, function() { 
    	privates.key.back();
    	if ( privates.key.isRoot() ) {
    		privates.menuWindow(); 
    	} else {
	    	privates.updateDecisionWindow( true );
	    }
    });
    
    privates.subscribe( Topics.FORWARD, function( msg, data ) { 
    	privates.key.choose(data);
	    privates.updateDecisionWindow();
    });
    
    privates.subscribe( Topics.VIDEO, function( msg, data ) { 
    	var vv = VideoView.createVideoView( Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, data ) );
    	vv.open();
    });
    
    privates.subscribe( Topics.BROWSE, function() { 
    	privates.browseWindow();
    });
    
    privates.subscribe( Topics.JUMPTO, function( msg, id ) { 
    	privates.key.setCurrentNode(id);
	    privates.updateDecisionWindow();
    });
    
    privates.subscribe( Topics.SPEEDBUG, function() { 
    	privates.speedBugWindow();
    });
	

	// Return public API
	_(appWin).extend({
		getCurrentWindow: function() {
			return privates.currentWindow;
		},
		start: function() {
			privates.menuWindow();
		},
		close: function() {
			privates.cleanUp();
		}
	});

	return appWin;
}
exports.createAppWindow = createAppWindow;