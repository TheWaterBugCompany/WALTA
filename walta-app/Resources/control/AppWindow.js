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
var PhotoView = require('ui/PhotoView');
var HtmlView = require('ui/HtmlView');
var TopLevelWindow = require('ui/TopLevelWindow');

var errorHandler = function(err) {
	var errWin = Ti.UI.createWindow({
					title: 'Internal error',
					background: 'red'
		});
	errWin.open();
};



function createAppWindow( keyName, keyPath ) {
		
		if ( ! keyPath ) {
			keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
		}
		var keyUrl = keyPath + keyName + '/';
		
		
		// Private variables that are not to be exposed as API
		var privates = {
			key: null,
			isMenuWindow: false,
			currentWindow: null,

			callbacks: [],
			
			// Load the key
			loadKey: function( keyUrl ) {
				this.key = KeyLoader.loadKey(keyUrl);
				if ( ! this.key ) {
					throw "Failed to load the key: " + keyUrl;
				}
			},
			
			
			makeTopLevelWindow: function(args) {
				var lastWindow = ( this.currentWindow && this.currentWindow.window ? this.currentWindow.window : null );
				win = TopLevelWindow.makeTopLevelWindow(args, lastWindow);
				
				args.window = win;
				this.currentWindow = args;
				this.isMenuWindow = false;
			},
			
			menuWindow: function(args) {
				this.makeTopLevelWindow(_({
					name: 'home',
					uiObj: MenuView.createMenuView(),
					portrait: false
				}).extend(args));
				this.isMenuWindow = true;
			},
			
			browseWindow: function() {
				this.makeTopLevelWindow({
					name: 'browse',
					title: 'Browse',
					uiObj: BrowseView.createBrowseView(privates.key),
					swivel: false
				});	
			},
			
			speedBugWindow: function() {
				this.makeTopLevelWindow({
					name: 'speedbug',
					title: 'Speedbug',
					uiObj: SpeedbugView.createSpeedbugView(privates.key)
				});	
			},
			
			galleryWindow: function() {
				this.makeTopLevelWindow({
					name: 'gallery',
					title: 'Gallery',
					uiObj: PhotoView.createPhotoView([ 
							'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
							'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
							'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
						])
				});	
			},
			
			helpWindow: function() {
				this.makeTopLevelWindow({
					name: 'help',
					title: 'Help',
					uiObj: HtmlView.createHtmlView( keyUrl + 'help/WBAhelp.xhtml' )
				});	
			},
			
			aboutWindow: function() {
				this.makeTopLevelWindow({
					name: 'about',
					title: 'About',
					uiObj: HtmlView.createHtmlView( keyUrl + 'credits/credits.xhtml' )
				});	
			},
			
			updateDecisionWindow: function( args ) {
				var node = this.key.getCurrentNode();
				
				// KeyView when on a decision point
				// but TaxonView when on a leaf node
				if ( this.key.isNode( node ) ) {
					this.makeTopLevelWindow( _({
						name: 'decision',
						title: 'ALT Key',
						uiObj: KeyView.createKeyView( node )
					}).extend( args ));
				} else {
					this.makeTopLevelWindow( _({
						name: 'decision',
						title: 'ALT Key',
						uiObj: TaxonView.createTaxonView( node )
					}).extend( args ));
				}
			},
			
			subscribe: function( topic, cb ) {
				this.callbacks.push( PubSub.subscribe( topic, cb )  );
			},
			
			cleanUp: function() {
				if ( this.currentWindow && this.currentWindow.window ) {
					this.currentWindow.window.close();
					this.currentWindow = null;
				}
				_(this.callbacks).each(function(cb) {
					PubSub.unsubscribe( cb );
				});
				this.key = null;
			}
		};
		
		var appWin = { keyUrl: keyUrl };
		
		privates.subscribe( Topics.HOME, function() { privates.menuWindow();  } );
		
	    privates.subscribe( Topics.KEYSEARCH, function() { 
	    	privates.key.reset();
	    	privates.updateDecisionWindow();
	    });
	    
	    privates.subscribe( Topics.BACK, function() { 
	    	if ( privates.key.isRoot() ) {
	    		if ( privates.isMenuWindow ) {
	    			if ( Ti.Platform.osname === 'android'  ) {
	    				Ti.Android.currentActivity.finish();
	    			}
	    		} else {
	    			privates.menuWindow();
	    		} 
	    	} else {
	    		privates.key.back();
		    	privates.updateDecisionWindow({ slide: 'left' } );
		    }
	    });
	    
	    privates.subscribe( Topics.FORWARD, function( msg, data ) { 
	    	privates.key.choose(data);
		    privates.updateDecisionWindow({ slide: 'right' });
	    });
	    
	    privates.subscribe( Topics.VIDEO, function( msg, data ) { 
	    	var vv = VideoView.createVideoView( data );
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
	    
	    privates.subscribe( Topics.GALLERY, function() { 
	    	privates.galleryWindow();
	    });
	    
	    privates.subscribe( Topics.HELP, function() { 
	    	privates.helpWindow();
	    });
	    
	    privates.subscribe( Topics.ABOUT, function() { 
	    	privates.aboutWindow();
	    });
		
		
	
		// Return public API
		_(appWin).extend({
			getCurrentWindow: function() {
				return privates.currentWindow;
			},
			start: function() {
		
					// Overlay a windows on the splash screen to show loading indicator
					var args = {};
					
					// Under iPhone the splash screen is not display transparently underneath
					// the app so we need to set the background to an appropriate image.
					if ( Ti.Platform.osname === 'iphone' ) {
						if ( Ti.Platform.displayCaps.density === 'high' ) {
							args['backgroundImage'] = 'Default@2x.png';
						} else {
							args['backgroundImage'] = 'Default.png';
						}
					}
					
					var actWin = Ti.UI.createWindow(args);
					var actInd = Ti.UI.createActivityIndicator({
						height: Ti.UI.SIZE,
						width: Ti.UI.SIZE,
						color: 'white',
						font: { fontFamily: 'Tahoma', fontSize:'28dip' },
						bottom: '30dip',
						right: '120dip',
						style: ( Ti.Platform.osname === 'iphone' ? Titanium.UI.iPhone.ActivityIndicatorStyle.BIG : Titanium.UI.ActivityIndicatorStyle.BIG )
					});
					
					actWin.add( actInd );
					actWin.open();
					actInd.show();
				
					privates.loadKey( appWin.keyUrl );
					privates.menuWindow( {
						onOpen: function() {			
							actInd.hide();
							actWin.close();
						}
					});
	
			},
			close: function() {
				privates.cleanUp();
			}
		});
	
		return appWin;
}

exports.createAppWindow = createAppWindow;