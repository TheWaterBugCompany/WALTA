/*
 * Module: AppWindow
 * 
 */
function createAppWindow( keyName, keyPath ) {
	
		var _ = require('lib/underscore')._;
		var PubSub = require('lib/pubsub');
		var Topics = require('ui/Topics');
		var KeyLoader = require('logic/KeyLoaderXml');
		var TopLevelWindow = require('ui/TopLevelWindow');
		var PlatformSpecific = require('ui/PlatformSpecific');
		
		if ( ! keyPath ) {
			keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
		}
		var keyUrl = keyPath + keyName + '/';
		
		
		// Private variables that are not to be exposed as API
		var privates = {
			key: null,
			isMenuWindow: false,

			callbacks: [],
			
			loadKey: function( keyUrl ) {
				this.key = KeyLoader.loadKey(keyUrl);
				if ( ! this.key ) {
					throw "Failed to load the key: " + keyUrl;
				}
			},
			
			menuWindow: function(args) {
				var MenuView = require('ui/MenuView');
				TopLevelWindow.makeTopLevelWindow(_({
					name: 'home',
					uiObj: MenuView.createMenuView(),
					portrait: false
				}).extend(args));
				this.isMenuWindow = true;
			},
			
			browseWindow: function() {
				var BrowseView = require('ui/BrowseView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'browse',
					title: 'Browse',
					uiObj: BrowseView.createBrowseView(privates.key),
					swivel: false
				});	
				this.isMenuWindow = false;
			},
			
			speedBugWindow: function() {
				var SpeedbugView = require('ui/SpeedbugView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'speedbug',
					title: 'Speedbug',
					uiObj: SpeedbugView.createSpeedbugView(privates.key)
				});	
				this.isMenuWindow = false;
			},
			
			galleryWindow: function() {
				var GalleryWindow = require('ui/GalleryWindow');
				var win = GalleryWindow.createGalleryWindow( 
					_.first( _.shuffle( privates.key.findAllMedia('photoUrls') ), 20 ),
					 false );
				win.open();
				this.isMenuWindow = false;
			},
			
			helpWindow: function() {
				var HtmlView = require('ui/HtmlView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'help',
					title: 'Help',
					uiObj: HtmlView.createHtmlView( keyUrl + 'help/WBAhelp.xhtml' )
				});	
				this.isMenuWindow = false;
			},
			
			aboutWindow: function() {
				var HtmlView = require('ui/HtmlView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'about',
					title: 'About',
					uiObj: HtmlView.createHtmlView( keyUrl + 'credits/credits.xhtml' )
				});	
				this.isMenuWindow = false;
			},
			
			updateDecisionWindow: function( args ) {
				var node = this.key.getCurrentNode();
				if ( ! args ) args = {};
				_(args).extend({
					name: 'decision',
					title: 'ALT Key'
				});
				// KeyView when on a decision point
				// but TaxonView when on a leaf node
				if ( this.key.isNode( node ) ) {
					var KeyView = require('ui/KeyView');
					args.uiObj = KeyView.createKeyView( node );
				} else {
					var TaxonView = require('ui/TaxonView');
				 	args.uiObj = TaxonView.createTaxonView( node );
				}
				
				TopLevelWindow.makeTopLevelWindow(args);
				
				this.isMenuWindow = false;
			},
			
			subscribe: function( topic, cb ) {
				this.callbacks.push( PubSub.subscribe( topic, cb )  );
			},
			
			cleanUp: function() {
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
	    	privates.updateDecisionWindow({ slide: 'right' });
	    });
	    
	    privates.subscribe( Topics.BACK, function() { 
	    	if ( privates.key.isRoot() ) {
	    		if ( ! privates.isMenuWindow ) {
	    			privates.menuWindow({ slide: 'left' });
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
	    	var VideoView = require('ui/VideoView');
	    	var vv = VideoView.createVideoView( data );
	    	vv.open();
	    });
	    
	    privates.subscribe( Topics.BROWSE, function() { 
	    	privates.browseWindow();
	    });
	    
	    privates.subscribe( Topics.JUMPTO, function( msg, id ) { 
	    	if ( ! _.isUndefined( id ) ) {
	    		Ti.API.trace("Topics.JUMPTO " + id + " node.");
	    		privates.key.setCurrentNode(id);
		    	privates.updateDecisionWindow();
		    	
		    } else {
		    	Ti.API.error("Topics.JUMPTO undefined node!");
		    }
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
			start: function() {
					var actWin = Ti.UI.createWindow({
						backgroundImage: Ti.Filesystem.resourcesDirectory + 'images/background.png',
						fullscreen: true,
						navBarHidden: true
					});
					var actInd = Ti.UI.createActivityIndicator({
						height: Ti.UI.SIZE,
						width: Ti.UI.SIZE,
						color: 'white',
						font: { fontFamily: 'Tahoma', fontSize:'28dip' },
						bottom: '30dip',
						right: '120dip',
						style: PlatformSpecific.getLoadingIndicatorStyle
					});
					
					actWin.add( actInd );
					actWin.addEventListener( 'open', function() {
						// Do long work of loading key
						privates.loadKey( appWin.keyUrl );
						PubSub.publish( Topics.HOME );
					});
					TopLevelWindow.transitionWindows( actWin );
					actInd.show();
	
			},
			close: function() {
				privates.cleanUp();
			}
		});
	
		return appWin;
}

exports.createAppWindow = createAppWindow;