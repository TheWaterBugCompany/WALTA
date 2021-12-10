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
var Sample = require('logic/Sample');
var { Navigation } = require('logic/Navigation');
var debug = m => Ti.API.info(m);

var System = $.args.System;
var Key = $.args.Key;
var View = $.args.View;
var Survey = $.args.Survey;

var nav = new Navigation();

nav.onOpenView = function(ctl,args) {
  _.extend(args, {key: Key});
  View.openView(ctl,args);
}

nav.onCloseApp = function() {
  System.closeApp();
}

nav.onDiscardEdits = function () {
  return new Promise(function (resolve, reject) {
    $.saveOrDiscard = Ti.UI.createAlertDialog({
      persistent: true,
      cancel: 1,
      message: "The current sample has unsaved edits, are you sure you want to discard these changes?",
      title: "Unsaved Changes",
      buttonNames: ['Discard', 'Cancel']
    });
    $.saveOrDiscard.show();
    Topics.fireTopicEvent(Topics.DISCARD_OR_SAVE);
    $.saveOrDiscard.addEventListener('click', function (e) {
      $.saveOrDiscard.hide();
      Ti.API.info(`index = ${e.index}`)
      if (e.index == 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}
 function siteDetailsWindow(args) {
  System.requestPermission(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.READ_EXTERNAL_STORAGE'],
    function (e) {
      if (e.success) {
        nav.openController("SiteDetails", args);
      } else {
        alert("You need to enable access to location, the camera, and photos on external storage, in order to perform a survey!");
       nav.openController("SiteDetails", args);
      }
    });
}

function updateDecisionWindow(args) {
  var node = args.node;
  if (!node) {
    node = Key.getRootNode();
    args.node = node;
  }
  if (!args)
    args = {};
  args.key = Key;
  if (Key.isNode(node)) {
     nav.openController("KeySearch", args);
  } else {
     nav.openController("TaxonDetails", args);
  }
}



function startApp(options) {
  Topics.subscribe(Topics.KEYSEARCH, function (data) {
    var node = (data.surveyType === Sample.SURVEY_MAYFLY ? Key.findNode("mayfly_start_point") : Key.getRootNode());
    Key.reset(node);
    updateDecisionWindow(_(data).extend({ slide: 'right' }));
  });

  function extend(obj, atts) {
    if (!obj) obj = {};
    _(obj).extend(atts);
    return obj;
  }

  Topics.subscribe(Topics.VIDEO, (data) => nav.openController("VideoPlayer", data));
  Topics.subscribe(Topics.BACK, (data) => nav.goBack(data));
  Topics.subscribe(Topics.UP, (data) => updateDecisionWindow(extend(data, { slide: 'left' })));
  Topics.subscribe(Topics.FORWARD, (data) => updateDecisionWindow(extend(data, { slide: 'right' })));
  Topics.subscribe(Topics.HOME, (data) => nav.openController("Menu", data));
  Topics.subscribe(Topics.LOGIN, (data) =>  nav.openController("LogIn", data));
  Topics.subscribe(Topics.LOGGEDIN, (data) => Topics.fireTopicEvent(Topics.HOME, data));
  Topics.subscribe(Topics.BROWSE, (data) =>  nav.openController("TaxonList", data));
  Topics.subscribe(Topics.SAMPLETRAY, (data) =>  nav.openController("SampleTray", data));
  Topics.subscribe(Topics.IDENTIFY, (data) =>  nav.openController("SampleTray", data));
  Topics.subscribe(Topics.SITEDETAILS, (data) => siteDetailsWindow(data));
  Topics.subscribe(Topics.HABITAT, (data) => nav.openController("Habitat", data));
  Topics.subscribe(Topics.COMPLETE, (data) => nav.openController("Summary", data));
  Topics.subscribe(Topics.HISTORY, (data) => nav.openController("SampleHistory", data));
  Topics.subscribe(Topics.SPEEDBUG, (data) => nav.openController("Speedbug", data));
  Topics.subscribe(Topics.GALLERY, (data) => nav.openController("Gallery", data));
  // Topics.subscribe( Topics.MAYFLY_EMERGENCE, (data) => openController("MayflyEmergenceMap",data) );
  Topics.subscribe(Topics.HELP, (data) => nav.openController("Help", extend(data, { keyUrl: Key.url })));
  Topics.subscribe(Topics.ABOUT, (data) => nav.openController("About", extend(data, { keyUrl: Key.url })));
  Topics.subscribe(Topics.FORCE_UPLOAD, () => Survey.forceUpload());
  Topics.subscribe(Topics.NOTES, (data) =>  nav.openController("Notes", data));
  Topics.subscribe(Topics.JUMPTO, function (data) {
    if (!_.isUndefined(data.id)) {
      Key.setCurrentNode(data.id);
       updateDecisionWindow(_(data).extend({ node: Key.getCurrentNode() }));
    } else {
      debug("Topics.JUMPTO undefined node!");
    }
  });

  Topics.subscribe(Topics.MAYFLY, function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_MAYFLY);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });

  Topics.subscribe(Topics.ORDER, function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_ORDER);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });

  Topics.subscribe(Topics.DETAILED, function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_DETAILED);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });
  Topics.fireTopicEvent(Topics.HOME);


}

exports.openController = function() { return nav.openController.apply( nav, arguments ) };
exports.getHistory = function () { return nav.getHistory(); };
exports.startApp = startApp;