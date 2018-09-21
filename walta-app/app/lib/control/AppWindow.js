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
var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
var TopLevelWindow = require('ui/TopLevelWindow');
var PlatformSpecific = require('ui/PlatformSpecific');
var HtmlView = require('ui/HtmlView');
var BrowseView = require('ui/BrowseView');
var GalleryWindow = require('ui/GalleryWindow');
var VideoView = require('ui/VideoView');
var Sample = require('logic/Sample');
var GeoLocationService = require('logic/GeoLocationService');

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

			loadKey: function( keyUrl ) {
				this.key = KeyLoader.loadKey(keyUrl);
				if ( ! this.key ) {
					throw "Failed to load the key: " + keyUrl;
				}
			},

			menuWindow: function(args) {
				Alloy.createController("Menu").open();
			},

			browseWindow: function() {

				TopLevelWindow.makeTopLevelWindow({
					name: 'browse',
					title: 'Browse',
					uiObj: BrowseView.createBrowseView(privates.key),
					swivel: false,
					gps: true
				});
			},

			sampleTrayWindow: function(args) {
				if ( ! args )
					args = {};
				args.key = this.key;
				args.gps = true;
				Alloy.createController("SampleTray",args).open();
			},

			logInWindow: function(args) {
				Alloy.createController("LogIn").open();
			},

			siteDetailsWindow: function(args) {
				Alloy.createController("SiteDetails", { gps: true }).open();
			},

			habitatWindow: function(args) {
				Alloy.createController("Habitat", { gps: true }).open();
			},

			summaryWindow: function(args) {
				Alloy.createController("Summary", { gps: true }).open();
			},

			historyWindow: function() {
				Alloy.createController("SampleHistory").open();
			},

			speedBugWindow: function() {
				Alloy.createController("Speedbug", { key: privates.key, gps: true }).open();
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
				if ( ! args )
					args = {};
				args.gps = true;
				if ( this.key.isNode( node ) ) {
					args.keyNode = node;
					Alloy.createController("KeySearch", args ).open();
				} else {
					args.taxon = node;
					Alloy.createController("TaxonDetails", args ).open();
				}
			},

			subscribe: function( topic, cb ) {
				Topics.subscribe( topic, cb );
			},

			cleanUp: function() {
				this.key = null;
			},

			closeApp: function() {
				PlatformSpecific.appShutdown( privates );
			}
		};

		var appWin = { keyUrl: keyUrl };

		privates.subscribe( Topics.HOME, function() { privates.menuWindow();  } );

	privates.subscribe( Topics.LOGIN, function() {
		privates.logInWindow();
	});

    privates.subscribe( Topics.KEYSEARCH, function() {
		var node = ( Alloy.Models.sample.get("surveyType") == 0 ? 
			privates.key.findNode("mayfly_start_point") : privates.key.getRootNode() );
    	privates.key.reset(node);
    	privates.updateDecisionWindow({ slide: 'right' });
    });

    privates.subscribe( Topics.BACK, function(name) {
		Ti.API.info(`back: ${name}`);
    	if ( name === "home" ) {
    		privates.closeApp();
    	} else if ( name === "decision" ) {
    		if ( privates.key.isRoot() ) {
    			privates.sampleTrayWindow({ slide: 'left' });
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
	
	privates.subscribe( Topics.SAMPLETRAY, function(data) {
		
		privates.sampleTrayWindow();
	});

	privates.subscribe( Topics.IDENTIFY, function(data) {
		
		privates.sampleTrayWindow( { taxonId: data.taxonId } );
	});

	privates.subscribe( Topics.SITEDETAILS, function(data) {
		privates.siteDetailsWindow();
	});
	
	privates.subscribe( Topics.HABITAT, function(data) {
		privates.habitatWindow();
	});

	privates.subscribe( Topics.COMPLETE, function(data) {
		privates.summaryWindow();
	});

	privates.subscribe( Topics.HISTORY, function(data) {
		privates.historyWindow();
	});
	
    privates.subscribe( Topics.JUMPTO, function( data ) {
    	if ( ! _.isUndefined( data.id ) ) {
    		privates.key.setCurrentNode(data.id);
	    	privates.updateDecisionWindow();
	    } else {
	    	Ti.API.error("Topics.JUMPTO undefined node!");
	    }
    });

	privates.subscribe( Topics.MAYFLY, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.MAYFLY);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

	privates.subscribe( Topics.ORDER, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.ORDER);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

	privates.subscribe( Topics.DETAILED, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.DETAILED);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

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
			PlatformSpecific.appStartUp( privates );
			GeoLocationService.init();
			Topics.fireTopicEvent( Topics.HOME );
		},
		close: function() {
			privates.cleanUp();
		}
	});

	return appWin;
}

exports.createAppWindow = createAppWindow;
