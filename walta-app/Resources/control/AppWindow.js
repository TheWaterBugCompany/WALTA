/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
			
			menuWindow: function() {
				var MenuView = require('ui/MenuView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'home',
					uiObj: MenuView.createMenuView(),
					portrait: false
				});
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
					uiObj: HtmlView.createHtmlView( keyUrl + 'help/help.html' )
				});	
				this.isMenuWindow = false;
			},
			
			aboutWindow: function() {
				var HtmlView = require('ui/HtmlView');
				TopLevelWindow.makeTopLevelWindow({
					name: 'about',
					title: 'About',
					uiObj: HtmlView.createHtmlView( keyUrl + 'credits/credits.html' )
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
				privates.loadKey( appWin.keyUrl );
				PubSub.publish( Topics.HOME );
			},
			close: function() {
				privates.cleanUp();
			},
			getCurrentWindow: TopLevelWindow.getCurrentWindow
		});
	
		return appWin;
}

exports.createAppWindow = createAppWindow;