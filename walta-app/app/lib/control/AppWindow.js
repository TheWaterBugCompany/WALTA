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
var PlatformSpecific = require('ui/PlatformSpecific');
var VideoView = require('ui/VideoView');
var Sample = require('logic/Sample');
var GeoLocationService = require('logic/GeoLocationService'); 

/*
 * Module: AppWindow
 *
 */

function questionToString( args ) {
	if ( !args || !args.node )
		return "";
	return `[0]= ${args.node.questions[0].text} [1]= ${args.node.questions[1].text}`;
}

function dumpHistory( history ) {
	history.forEach((obj,i)=>{
		console.info(`${i}: ${obj.ctl} ${questionToString(obj.args)}`)
	});
}

function createAppWindow( keyName, keyPath ) {

		if ( ! keyPath ) {
			keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
		}
		var keyUrl = keyPath + keyName + '/';

		// Private variables that are not to be exposed as API
		var privates = {
			controller: null,
			key: null,
			history: [],

			loadKey: function( keyUrl ) {
				this.key = KeyLoader.loadKey(keyUrl);
				Alloy.Globals.Key = this.key;
				if ( ! this.key ) {
					throw "Failed to load the key: " + keyUrl;
				}
			},

			openController(ctl,args) {
				this.controller = Alloy.createController(ctl,args);
				this.controller.open();
				this.history.push({ctl:ctl,args:args});
			},

			goBack(args) {
				this.history.pop();
				if ( this.history.length === 0 ) {
					this.closeApp();
				} else {
					var cargs = this.history[this.history.length-1];
					var ctl = cargs.ctl;
					var oldArgs = cargs.args;
					if ( oldArgs )
						args = _(oldArgs).extend(args);
					this.controller = Alloy.createController(ctl,args);
					this.controller.open();
				}
			},

			menuWindow: function(args) {
				this.openController("Menu",args);
			},

			browseWindow: function(args) {
				if ( ! args )
					args = {};
				args.key = this.key;
				this.openController("TaxonList",args);
			},

			sampleTrayWindow: function(args) {
				if ( ! args )
					args = {};
				args.key = this.key;
				this.openController("SampleTray",args);
			},

			logInWindow: function(args) {
				this.openController("LogIn");
			},

			siteDetailsWindow: function(args) {
				var me = this;
				function startSurvey() {
					
					me.openController("SiteDetails",args);
				}

				if ( OS_ANDROID ) {
					Ti.API.debug('Asking for permissions...');
					Ti.Android.requestPermissions(
						[ 'android.permission.ACCESS_FINE_LOCATION','android.permission.CAMERA', 'android.permission.READ_EXTERNAL_STORAGE' ], 
						function(e) {
							if (e.success) {
								startSurvey();
							} else {
								alert("You need to enable access to location, the camera, and photos on external storage, in order to perform a survey!");
							}
						});
				} else {
					startSurvey()	
				}
				
			},

			habitatWindow: function(args) {
				this.openController("Habitat",args);
			},

			summaryWindow: function(args) {
				this.openController("Summary",args);
			},

			historyWindow: function() {
				this.openController("SampleHistory");
			},

			speedBugWindow: function(allowAddToSample, surveyType) {
				this.openController("Speedbug", { key: privates.key, surveyType: surveyType, allowAddToSample: allowAddToSample });
			},

			galleryWindow: function(args) {
				this.openController("Gallery", _(args).extend({ key: privates.key }) );
			},

			helpWindow: function() {
				this.openController("Help", { keyUrl: keyUrl });
			},

			aboutWindow: function() {
				this.openController("About", { keyUrl: keyUrl });
			},

			updateDecisionWindow: function( args ) {
				var node = args.node;
				if ( ! node ) {
					node = this.key.getRootNode();
					args.node = node;
				}
				if ( ! args )
					args = {};
				args.key = this.key;
				if ( this.key.isNode( node ) ) {
					this.openController("KeySearch", args );
				} else {
					this.openController("TaxonDetails", args );
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

		privates.subscribe( Topics.HOME, function() { 
			privates.menuWindow();  
		} );

	privates.subscribe( Topics.LOGIN, function() {
		privates.logInWindow();
	});

	privates.subscribe( Topics.LOGGEDIN, function() {
		Topics.fireTopicEvent( Topics.HOME, null );
	});

    privates.subscribe( Topics.KEYSEARCH, function(data) {
		var node = ( data.surveyType === Sample.SURVEY_MAYFLY ? privates.key.findNode("mayfly_start_point") : privates.key.getRootNode() );
		privates.key.reset(node);
    	privates.updateDecisionWindow(_(data).extend({ slide: 'right' }));
    });

    privates.subscribe( Topics.BACK, function(data) {
		privates.goBack(_(data).extend({slide:'left'}));
    });

    privates.subscribe( Topics.FORWARD, function( data ) {
	    privates.updateDecisionWindow(_(data).extend({ slide: 'right' }));
    });

    privates.subscribe( Topics.VIDEO, function( data ) {

    	var vv = VideoView.createVideoView( data.url );
    	vv.open();
    });

    privates.subscribe( Topics.BROWSE, function(data) {
    	privates.browseWindow(data);
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
	    	privates.updateDecisionWindow(_(data).extend({ node: privates.key.getCurrentNode()}));
	    } else {
	    	Ti.API.error("Topics.JUMPTO undefined node!");
	    }
    });

	privates.subscribe( Topics.MAYFLY, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_MAYFLY);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

	privates.subscribe( Topics.ORDER, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_ORDER);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

	privates.subscribe( Topics.DETAILED, function() {
		Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_DETAILED);
		Topics.fireTopicEvent( Topics.SITEDETAILS, null );
	} );

    privates.subscribe( Topics.SPEEDBUG, function(data) {
    	privates.speedBugWindow(data.allowAddToSample, data.surveyType );
    });

    privates.subscribe( Topics.GALLERY, function(data) {
    	privates.galleryWindow(data);
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
