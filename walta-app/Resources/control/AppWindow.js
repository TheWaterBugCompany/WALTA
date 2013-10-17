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
			var win = Ti.UI.createWindow( { 
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				backgroundColor: 'white',
				layout: 'vertical'
			});
			
			if ( args.title ) {
				win.add( AnchorBar.createAnchorBar( args.title ).view );
			}
			
			win.add( _(args.uiObj.view).extend( { 
				width: Ti.UI.FILL, 
				height: Ti.UI.FILL 
			}));
			//this.storeTopLevelWindow( args.name, args.uiObj, win );
			
			// Transition the windows
			win.open();
			if ( this.currentWindow )
				this.currentWindow.close();
			this.currentWindow = win;
		},
		
		menuWindow: function() {
			this.makeTopLevelWindow({
				name: 'home',
				uiObj: MenuView.createMenuView()
			});
		},
		
		browseWindow: function() {
			this.makeTopLevelWindow({
				name: 'browse',
				title: 'Browse',
				uiObj: BrowseView.createBrowseView(privates.key)
			});	
		},
		
		updateDecisionWindow: function() {
			var node = this.key.getCurrentNode();
			
			// KeyView when on a decision point
			// but TaxonView when on a leaf node
			if ( this.key.isNode( node ) ) {
				this.makeTopLevelWindow( {
					name: 'decision',
					title: 'ALT Key',
					uiObj: KeyView.createKeyView( node )
				});
			} else {
				this.makeTopLevelWindow( {
					name: 'decision',
					title: 'ALT Key',
					uiObj: TaxonView.createTaxonView( node )
				});
			}
		},
		
		storeTopLevelWindow: function( name, uiObj, win ) {
			this.windows[name] = {
				name: name,
				uiObj: uiObj,
				win: win
			};
		},
		
		/* 
		 * Bring the named window to the front and close
		 * the previous window behind it.
		 * TODO: Add transition effect 
		 */
		transitionToFront: function( name ) {
		/*	var oldWindow = null;
			if ( this.currentWindow ) 
			    oldWindow =  this.currentWindow.win;
			this.currentWindow = this.windows[name];
			this.currentWindow.win.open( { fullscreen: true } );
			if ( oldWindow ) 
				oldWindow.hide(); */
			return null;
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
	
	privates.menuWindow();
	
	privates.subscribe( Topics.HOME, function() { privates.menuWindow();  } );
	
    privates.subscribe( Topics.KEYSEARCH, function() { 
    	privates.key.reset();
    	privates.updateDecisionWindow();
    });
    
    privates.subscribe( Topics.BACK, function() { 
    	privates.key.back();
    	if ( privates.key.isRoot() ) {
    		privates.menuWindow(); 
    	} else {
	    	privates.updateDecisionWindow();
	    }
    });
    
    privates.subscribe( Topics.FORWARD, function( msg, data ) { 
    	privates.key.choose(data);
	    privates.updateDecisionWindow();
	    privates.transitionToFront( 'decision' ); 
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
	    privates.transitionToFront( 'decision' ); 
    });
	

	// Return public API
	_(appWin).extend({
		getCurrentWindow: function() {
			return privates.currentWindow;
		},
		start: function() {
			privates.transitionToFront( 'home' );
		},
		close: function() {
			privates.cleanUp();
		}
	});

	return appWin;
}
exports.createAppWindow = createAppWindow;