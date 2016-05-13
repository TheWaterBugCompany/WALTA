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
var _ = require('lib/underscore')._;

var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
var TopLevelWindow = require('ui/TopLevelWindow');
var PlatformSpecific = require('ui/PlatformSpecific');
var HtmlView = require('ui/HtmlView');
var BrowseView = require('ui/BrowseView');
var MenuView = require('ui/MenuView');
var SpeedbugView = require('ui/SpeedbugView');
var GalleryWindow = require('ui/GalleryWindow');
var VideoView = require('ui/VideoView');

				
/*
 * Module: AppWindow
 * 
 */
function createAppWindow( keyName, keyPath ) {
	
		if ( ! keyPath ) {
			keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
		}
		var keyUrl = keyPath + keyName + '/';

		
		// Private variables that are not to be exposed as API
		var privates = {
			platformWidth: 0,
			platformHeight: 0,
			key: null,
			
			loadKey: function( keyUrl ) {
				this.key = KeyLoader.loadKey(keyUrl);
				if ( ! this.key ) {
					throw "Failed to load the key: " + keyUrl;
				}
			},
			
			menuWindow: function(args) {
				if ( ! args ) args = {};
				_(args).extend({
					name: 'home',
					uiObj: MenuView.createMenuView(privates.platformWidth),
					portrait: false
				});
				TopLevelWindow.makeTopLevelWindow(args);
			},
			
			browseWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'browse',
					title: 'Browse',
					uiObj: BrowseView.createBrowseView(privates.key),
					swivel: false
				});	
			},
			
			speedBugWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'speedbug',
					title: 'Speedbug',
					uiObj: SpeedbugView.createSpeedbugView(privates.key, privates.platformHeight )
				});	
			},
			
			galleryWindow: function() {
				var win = GalleryWindow.createGalleryWindow( _.first( _.shuffle( privates.key.findAllMedia('photoUrls') ), 20 ), false );
				win.open();
			},

			helpWindow: function() {
				TopLevelWindow.makeTopLevelWindow({
					name: 'help',
					title: 'Help',
					uiObj: HtmlView.createHtmlView( keyUrl + 'help/help.html' )
				});	
			},
			
			aboutWindow: function() {
				TopLevelWindow.makeTopLevelWindow({
					name: 'about',
					title: 'About',
					uiObj: HtmlView.createHtmlView( keyUrl + 'credits/credits.html' )
				});	
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
					args.uiObj = KeyView.createKeyView( node, privates.platformHeight  );
				} else {
					var TaxonView = require('ui/TaxonView');
				 	args.uiObj = TaxonView.createTaxonView( node, privates.platformHeight  );
				}
				
				TopLevelWindow.makeTopLevelWindow(args);
			},
			
			subscribe: function( topic, cb ) {
				Topics.subscribe( topic, cb );
			},
			
			cleanUp: function() {
				this.key = null;
			},
			
			closeApp: function() {
				if ( 'android' === Ti.Platform.osname) {
					var win = TopLevelWindow.getCurrentWindow().win;
					win.exitOnClose = true;
					win.close();
				}
			}
		};
		
		var appWin = { keyUrl: keyUrl };
		
		privates.subscribe( Topics.HOME, function() { privates.menuWindow();  } );
		
	    privates.subscribe( Topics.KEYSEARCH, function() { 
	    	privates.key.reset();
	    	privates.updateDecisionWindow({ slide: 'right' });
	    });
	    
	    privates.subscribe( Topics.BACK, function() { 
	    	var name = TopLevelWindow.getCurrentWindow().name;
	    	if ( name === "home" ) {
	    		privates.closeApp();
	    	} else if ( name === 'decision' ) {
	    		if ( privates.key.isRoot() ) {
	    			privates.menuWindow({ slide: 'left' });
				} else {
	    			privates.key.back();
		    		privates.updateDecisionWindow({ slide: 'left' } );
		    	}
		    } else {
		    	privates.menuWindow();
		    }
		    
	    });
	    
	    privates.subscribe( Topics.FORWARD, function( data ) { 
	    	privates.key.choose( data.index );
		    privates.updateDecisionWindow({ slide: 'right' });
	    });
	    
	    privates.subscribe( Topics.VIDEO, function( data ) { 

	    	var vv = VideoView.createVideoView( data.url );
	    	vv.open();
	    });
	    
	    privates.subscribe( Topics.BROWSE, function() { 
	    	privates.browseWindow();
	    });
	    
	    privates.subscribe( Topics.JUMPTO, function( data ) { 
	    	if ( ! _.isUndefined( data.id ) ) {
	    		privates.key.setCurrentNode(data.id);
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
				var ready = false;
				var pWidth = Titanium.Platform.displayCaps.platformWidth;
				var pHeight = Titanium.Platform.displayCaps.platformHeight;
				privates.platformWidth = PlatformSpecific.convertSystemToDip( pWidth < pHeight ? pHeight : pWidth );
				privates.platformHeight = PlatformSpecific.convertSystemToDip( pWidth >= pHeight ? pHeight : pWidth );
				Topics.fireTopicEvent( Topics.HOME );
			},
			close: function() {
				privates.cleanUp();
			},
			getCurrentWindow: TopLevelWindow.getCurrentWindow
		});
	
		return appWin;
}

exports.createAppWindow = createAppWindow;