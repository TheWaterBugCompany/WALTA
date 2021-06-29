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

var CerdiApi = require("logic/CerdiApi");
var SampleSync = require("logic/SampleSync");
var Topics = require('ui/Topics');
var KeyLoader = require('logic/KeyLoaderJson');
var PlatformSpecific = require('ui/PlatformSpecific');
var Sample = require('logic/Sample');
var GeoLocationService = require('logic/GeoLocationService'); 
var Crashlytics = require('util/Crashlytics');
var debug = m => Ti.API.info(m);
var log = Crashlytics.log;
Topics.init();

function questionToString( args ) {
  if ( !args || !args.node || !args.node.questions )
    return "";
  return `[0]= ${args.node.questions[0].text} [1]= ${args.node.questions[1].text}`;
}

function dumpHistory() {
  history.forEach((obj,i)=>{
    console.info(`${i}: ${obj.ctl} ${obj.args.slide} ${(obj.args.node && obj.args.node.id )?obj.args.node.id:"(no id)"} ${questionToString(obj.args)}`)
  });
}

let controller = null;
let key = null;
let history = [];

function getCurrentController() {
  return controller;
}

function getHistory() {
  return history;
}

function loadKey( keyUrl ) {
  key = KeyLoader.loadKey(keyUrl);
  Alloy.Globals.Key = key;
  if ( ! key ) {
    throw "Failed to load the key: " + keyUrl;
  }
}

function openController(ctl,args) {
  if ( !args ) args = {};
  if ( !args.slide ) args.slide = "none";
  if ( !args.key ) args.key = key;

  // find the previous instance of an equivalent screen and truncate
  // the history to avoid the ability to create long loops as this
  // is annoying to the user.
  var page = {ctl:ctl,args:args};
  var index = _(history).findIndex( (h)=>isPageEquivalent(h,page) );
  if ( index >= 0 ){
    history = history.slice(0,index);
  }

  // add this page to the history
  history.push(page);
  dumpHistory();

  
  debug(`opening controller="${ctl}" with args.readonly= ${args.readonly}`);
  controller = Alloy.createController(ctl,args);
  controller.open();

  // search for a version of this page 
  function isPageEquivalent( a , b ) {
    if ( a.ctl === b.ctl ) {
      if ( a.args.node && b.args.node ) {
        return (a.args.node.id && b.args.node.id && (a.args.node.id === b.args.node.id) );
      } else {
        return true;
      }
    }
    return false;
  }

  
}

function goBack(args) {
  if ( ! args ) args = {};
  var currentArgs = history.pop().args;
  if ( history.length === 0 ) {
    closeApp();
  } else {
    var cargs = history[history.length-1];
    var ctl = cargs.ctl;
    var newargs = cargs.args;
    if ( args.slide ) {
      newargs.slide = args.slide
    } else {
      if ( currentArgs.slide === "none" ) {
        newargs.slide = "none";
      } else {
        newargs.slide = "left";
      }
    }
    debug(`opening controller (on back) ="${ctl}" with args.slide="${newargs.slide}"`);
    openController(ctl,newargs);

  }
}

function siteDetailsWindow(args) {
  if ( OS_ANDROID ) {
    debug('Asking for permissions...');
    Ti.Android.requestPermissions(
      [ 'android.permission.ACCESS_FINE_LOCATION','android.permission.CAMERA', 'android.permission.READ_EXTERNAL_STORAGE' ], 
      function(e) {
        if (e.success) {
          openController("SiteDetails",args);
        } else {
          alert("You need to enable access to location, the camera, and photos on external storage, in order to perform a survey!");
        }
      });
  } else {
    openController("SiteDetails",args);
  }
}

function updateDecisionWindow( args ) {
  var node = args.node;
  if ( ! node ) {
    node = key.getRootNode();
    args.node = node;
  }
  if ( ! args )
    args = {};
  args.key = key;
  if ( key.isNode( node ) ) {
    openController("KeySearch", args );
  } else {
    openController("TaxonDetails", args );
  }
}

function closeApp() {
  PlatformSpecific.appShutdown();
}

function startApp(options) {

  Topics.subscribe( Topics.KEYSEARCH, function(data) {
    var node = ( data.surveyType === Sample.SURVEY_MAYFLY ? key.findNode("mayfly_start_point") : key.getRootNode() );
    key.reset(node);
    updateDecisionWindow(_(data).extend({ slide: 'right' }));
  });

  function extend( obj, atts ) {
    if ( ! obj ) obj = {};
    _(obj).extend(atts);
    return obj;
  }

  Topics.subscribe( Topics.VIDEO, (data) => openController("VideoPlayer", data ) );
  Topics.subscribe( Topics.BACK, (data) => goBack(data));
  Topics.subscribe( Topics.UP, (data) => updateDecisionWindow(extend(data,{ slide: 'left' })));
  Topics.subscribe( Topics.FORWARD, (data)=> updateDecisionWindow(extend(data,{ slide: 'right' })));
  Topics.subscribe( Topics.HOME, (data) => openController("Menu",data) );
  Topics.subscribe( Topics.LOGIN, (data) => openController("LogIn", data));
  Topics.subscribe( Topics.LOGGEDIN, (data) => Topics.fireTopicEvent( Topics.HOME, data ));
  Topics.subscribe( Topics.BROWSE, (data) => openController("TaxonList",data) );
  Topics.subscribe( Topics.SAMPLETRAY, (data) => openController("SampleTray",data) );
  Topics.subscribe( Topics.IDENTIFY, (data) => openController("SampleTray",data) );
  Topics.subscribe( Topics.SITEDETAILS, (data) => siteDetailsWindow(data) );
  Topics.subscribe( Topics.HABITAT, (data) => openController("Habitat",data) );
  Topics.subscribe( Topics.COMPLETE, (data) => openController("Summary",data) );
  Topics.subscribe( Topics.HISTORY, (data) => openController("SampleHistory",data) );
  Topics.subscribe( Topics.SPEEDBUG, (data) => openController("Speedbug",data) );
  Topics.subscribe( Topics.GALLERY, (data) => openController("Gallery",data) );
  Topics.subscribe( Topics.MAYFLY_EMERGENCE, (data) => openController("MayflyEmergenceMap",data) );
  Topics.subscribe( Topics.HELP, (data) => openController("Help", extend(data,{ keyUrl: key.url }) ) );
  Topics.subscribe( Topics.ABOUT, (data) => openController("About", extend(data,{ keyUrl: key.url }) ) );
  Topics.subscribe( Topics.FOREC_UPLOAD, () => {
    if ( !( options && options.nosync )) {
      debug("forcing synchronise");
      SampleSync.forceUpload();
    }
  })
  Topics.subscribe( Topics.JUMPTO, function( data ) {
    if ( ! _.isUndefined( data.id ) ) {
      key.setCurrentNode(data.id);
      updateDecisionWindow(_(data).extend({ node: key.getCurrentNode()}));
    } else {
      debug("Topics.JUMPTO undefined node!");
    }
  });

  Topics.subscribe( Topics.MAYFLY, function(data) {
    
    if ( !data ) data = {};
    Alloy.Collections.instance("sample").startNewSurveyIfComplete(Sample.SURVEY_MAYFLY, Alloy.Globals.CerdiApi.retrieveUserId());
    Topics.fireTopicEvent( Topics.SITEDETAILS, _(data).extend({slide:"right"}) );
  } );

  Topics.subscribe( Topics.ORDER, function(data) {
    if ( !data ) data = {};
    Alloy.Collections.instance("sample").startNewSurveyIfComplete(Sample.SURVEY_ORDER, Alloy.Globals.CerdiApi.retrieveUserId());
    Topics.fireTopicEvent( Topics.SITEDETAILS, _(data).extend({slide:"right"}) );
  } );

  Topics.subscribe( Topics.DETAILED, function(data) {
    if ( !data ) data = {};
    Alloy.Collections.instance("sample").startNewSurveyIfComplete(Sample.SURVEY_DETAILED, Alloy.Globals.CerdiApi.retrieveUserId());
    Topics.fireTopicEvent( Topics.SITEDETAILS, _(data).extend({slide:"right"}) );
  } );

 
  Alloy.Models.instance("sample").loadCurrent();
  Alloy.Collections.taxa = Alloy.Models.instance("sample").loadTaxa();

  if ( !( options && options.nosync )) {
    SampleSync.init();
  }
  var keyName = "walta";
  var keyPath;
  if ( ! keyPath ) {
    keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
  }
  var keyUrl = keyPath + keyName + '/';
  loadKey( keyUrl );
  PlatformSpecific.appStartUp();
  GeoLocationService.init();
  
  // Report user name to Crashlytics when logged in
  if ( Crashlytics.isAvailable() ) {
    function setUserId() { 
      Crashlytics.setUserId( Ti.App.Properties.getObject('userAccessUsername') ); 
    }
    Topics.subscribe( Topics.LOGGEDIN, (data) => setUserId() );
    if ( Alloy.Globals.CerdiApi.retrieveUserToken() ) {
      setUserId();
    }
  }
  Topics.fireTopicEvent( Topics.HOME );
}

exports.getCurrentController = getCurrentController;
exports.getHistory = getHistory;
exports.startApp = startApp; 