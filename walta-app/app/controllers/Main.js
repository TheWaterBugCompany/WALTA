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

let controller = null;
let key = null;
let history = [];

function loadKey( keyUrl ) {
  key = KeyLoader.loadKey(keyUrl);
  Alloy.Globals.Key = key;
  if ( ! key ) {
    throw "Failed to load the key: " + keyUrl;
  }
}

function openController(ctl,args) {
  if ( !args ) args = {};
  if ( !args.slide ) args.slide = "right";
  if ( !args.key ) args.key = key;
  Ti.API.info(`opening controller="${ctl}" with args.slide= ${args.slide}`);
  controller = Alloy.createController(ctl,args);
  controller.open();
  history.push({ctl:ctl,args:args});
}

function goBack(args) {
  if ( ! args ) args = {};
  if ( ! args.slide ) args.slide = "left";
  Ti.API.info(`going back with args.slide= ${args.slide}`);
  history.pop();
  if ( history.length === 0 ) {
    closeApp();
  } else {
    var cargs = history[history.length-1];
    var ctl = cargs.ctl;
    var oldArgs = cargs.args;
    if ( oldArgs ) args = _(oldArgs).extend(args);
    Ti.API.info(`opening controller="${ctl}" with args.slide= ${args.slide}`);
    controller = Alloy.createController(ctl,args);
    controller.open();
  }
}

function siteDetailsWindow(args) {
  if ( OS_ANDROID ) {
    Ti.API.debug('Asking for permissions...');
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

function startApp() {
  Topics.subscribe( Topics.KEYSEARCH, function(data) {
    var node = ( data.surveyType === Sample.SURVEY_MAYFLY ? key.findNode("mayfly_start_point") : key.getRootNode() );
    key.reset(node);
    updateDecisionWindow(_(data).extend({ slide: 'right' }));
  });

  Topics.subscribe( Topics.VIDEO, (data) => openController("VideoPlayer", data ) );
  Topics.subscribe( Topics.BACK, (data) => goBack(data));
  Topics.subscribe( Topics.FORWARD, (data)=> updateDecisionWindow(_(data).extend({ slide: 'right' })));
  Topics.subscribe( Topics.HOME, () => openController("Menu",{ slide: "none" }) );
  Topics.subscribe( Topics.LOGIN, () => openController("LogIn", { slide: "none" }));
  Topics.subscribe( Topics.LOGGEDIN, () => Topics.fireTopicEvent( Topics.HOME ) );
  Topics.subscribe( Topics.BROWSE, () => openController("TaxonList") );
  Topics.subscribe( Topics.SAMPLETRAY, () => openController("SampleTray") );
  Topics.subscribe( Topics.IDENTIFY, (data) => openController("SampleTray",data) );
  Topics.subscribe( Topics.SITEDETAILS, (data) => siteDetailsWindow(data) );
  Topics.subscribe( Topics.HABITAT, () => openController("Habitat") );
  Topics.subscribe( Topics.COMPLETE, () => openController("Summary") );
  Topics.subscribe( Topics.HISTORY, () => openController("SampleHistory") );
  Topics.subscribe( Topics.SPEEDBUG, (data) => openController("Speedbug",data) );
  Topics.subscribe( Topics.GALLERY, (data) => openController("Gallery",data) );
  Topics.subscribe( Topics.HELP, () => openController("Help") );
  Topics.subscribe( Topics.ABOUT, () => openController("About") );

  Topics.subscribe( Topics.JUMPTO, function( data ) {
    if ( ! _.isUndefined( data.id ) ) {
      key.setCurrentNode(data.id);
      updateDecisionWindow(_(data).extend({ node: key.getCurrentNode()}));
    } else {
      Ti.API.error("Topics.JUMPTO undefined node!");
    }
  });

  Topics.subscribe( Topics.MAYFLY, function(data) {
    Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_MAYFLY);
    Topics.fireTopicEvent( Topics.SITEDETAILS, data );
  } );

  Topics.subscribe( Topics.ORDER, function(data) {
    Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_ORDER);
    Topics.fireTopicEvent( Topics.SITEDETAILS, data );
  } );

  Topics.subscribe( Topics.DETAILED, function(data) {
    Alloy.Collections.sample.startNewSurveyIfComplete(Sample.SURVEY_DETAILED);
    Topics.fireTopicEvent( Topics.SITEDETAILS, data );
  } );

  Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
  Alloy.Collections.instance("sample").load();
  SampleSync.init();
  var keyName = "walta";
  var keyPath;
  if ( ! keyPath ) {
    keyPath = Ti.Filesystem.resourcesDirectory + "taxonomy/";
  }
  var keyUrl = keyPath + keyName + '/';
  loadKey( keyUrl );
  PlatformSpecific.appStartUp();
  GeoLocationService.init();
  Topics.fireTopicEvent( Topics.HOME );
}

startApp();
