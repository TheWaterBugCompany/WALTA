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

				TopLevelWindow.makeTopLevelWindow({
					name: 'home',
					uiObj: MenuView.createMenuView(),
					portrait: false
				});
				this.isMenuWindow = true;
			},
			
			browseWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'browse',
					title: 'Browse',
					uiObj: BrowseView.createBrowseView(privates.key),
					swivel: false
				});	
				this.isMenuWindow = false;
			},
			
			speedBugWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'speedbug',
					title: 'Speedbug',
					uiObj: SpeedbugView.createSpeedbugView(privates.key)
				});	
				this.isMenuWindow = false;
			},
			
			galleryWindow: function() {
				var win = GalleryWindow.createGalleryWindow( _.first( _.shuffle( privates.key.findAllMedia('photoUrls') ), 20 ), false );
				win.open();
				this.isMenuWindow = false;
			},
			
	
			
			helpWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'help',
					title: 'Help',
					uiObj: HtmlView.createHtmlView( keyUrl + 'help/help.html' )
				});	
				this.isMenuWindow = false;
			},
			
			aboutWindow: function() {

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
				Topics.subscribe( topic, cb );
			},
			
			cleanUp: function() {
				this.key = null;
			},
			
			closeApp: function() {
				if ( 'android' === Ti.Platform.osname) {
					var activity = Titanium.Android.currentActivity;
     				activity.finish();
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
	    	if ( privates.key.isRoot() ) {
	    		if ( ! privates.isMenuWindow ) {
	    			privates.menuWindow({ slide: 'left' });
	    		} else {
	    			privates.closeApp();
	    		}
	    	} else {
	    		privates.key.back();
		    	privates.updateDecisionWindow({ slide: 'left' } );

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
	    		Ti.API.trace("Topics.JUMPTO " + data.id + " node.");
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