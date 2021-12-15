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

var debug = m => Ti.API.info(m);

var { System, Key, Survey, Navigation } = $.args;
function siteDetailsWindow(args) {
  System.requestPermission(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.READ_EXTERNAL_STORAGE'],
    function (e) {
      if (e.success) {
        Navigation.openController("SiteDetails", args);
      } else {
        alert("You need to enable access to location, the camera, and photos on external storage, in order to perform a survey!");
       Navigation.openController("SiteDetails", args);
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
     Navigation.openController("KeySearch", args);
  } else {
     Navigation.openController("TaxonDetails", args);
  }
}

async function startApp(options) {
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

  Topics.subscribe(Topics.VIDEO, (data) => Navigation.openController("VideoPlayer", data));
  Topics.subscribe(Topics.BACK, (data) => Navigation.goBack(data));
  Topics.subscribe(Topics.UP, (data) => updateDecisionWindow(extend(data, { slide: 'left' })));
  Topics.subscribe(Topics.FORWARD, (data) => updateDecisionWindow(extend(data, { slide: 'right' })));
  Topics.subscribe(Topics.HOME, (data) => Navigation.openController("Menu", data));
  Topics.subscribe(Topics.LOGIN, (data) =>  Navigation.openController("LogIn", data));
  Topics.subscribe(Topics.LOGGEDIN, (data) => Topics.fireTopicEvent(Topics.HOME, data));
  Topics.subscribe(Topics.BROWSE, (data) =>  Navigation.openController("TaxonList", data));
  Topics.subscribe(Topics.SAMPLETRAY, (data) =>  Navigation.openController("SampleTray", data));
  Topics.subscribe(Topics.IDENTIFY, (data) =>  Navigation.openController("SampleTray", data));
  Topics.subscribe(Topics.SITEDETAILS, (data) => siteDetailsWindow(data));
  Topics.subscribe(Topics.HABITAT, (data) => Navigation.openController("Habitat", data));
  Topics.subscribe(Topics.COMPLETE, (data) => Navigation.openController("Summary", data));
  Topics.subscribe(Topics.HISTORY, (data) => Navigation.openController("SampleHistory", data));
  Topics.subscribe(Topics.SPEEDBUG, (data) => Navigation.openController("Speedbug", data));
  Topics.subscribe(Topics.GALLERY, (data) => Navigation.openController("Gallery", data));
  // Topics.subscribe( Topics.MAYFLY_EMERGENCE, (data) => openController("MayflyEmergenceMap",data) );
  Topics.subscribe(Topics.HELP, (data) => Navigation.openController("Help", extend(data, { keyUrl: Key.url })));
  Topics.subscribe(Topics.ABOUT, (data) => Navigation.openController("About", extend(data, { keyUrl: Key.url })));
  Topics.subscribe(Topics.FORCE_UPLOAD, () => Survey.forceUpload());
  Topics.subscribe(Topics.NOTES, (data) =>  Navigation.openController("Notes", data));
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
 await Navigation.openController("Menu", {});
}
exports.startApp = startApp;