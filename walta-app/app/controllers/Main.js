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
var { checkForErrors } = require('util/PromiseUtils');

var debug = m => Ti.API.info(m);

var { System, Key, Survey, Navigation } = $.args;
async function siteDetailsWindow(args) {
  let result = await System.requestPermission(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.READ_EXTERNAL_STORAGE']);
  if (result.success) {
    await Navigation.openController("SiteDetails", args);
  } else {
    alert("You need to enable access to location, the camera, and photos on external storage, in order to perform a survey!");
  }
}

async function updateDecisionWindow(args) {
  var node = args.node;
  if (!node) {
    node = Key.getRootNode();
    args.node = node;
  }
  if (!args)
    args = {};
  args.key = Key;
  if (Key.isNode(node)) {
    await Navigation.openController("KeySearch", args);
  } else {
    await Navigation.openController("TaxonDetails", args);
  }
}

async function startApp(options) {
  Topics.subscribe(Topics.KEYSEARCH, async function (data) {
    var node = (data.surveyType === Sample.SURVEY_MAYFLY ? Key.findNode("mayfly_start_point") : Key.getRootNode());
    Key.reset(node);
    await updateDecisionWindow(_(data).extend({ slide: 'right' }));
  });

  function extend(obj, atts) {
    if (!obj) obj = {};
    _(obj).extend(atts);
    return obj;
  }

  
  function routePromise(topic, callback ) {
    Topics.subscribe(topic, (data) => {
      checkForErrors( callback(data) );
    })
  }

  routePromise(Topics.VIDEO, (data) => Navigation.openController("VideoPlayer", data));
  routePromise(Topics.BACK, (data) => Navigation.goBack(data));
  routePromise(Topics.UP, (data) => updateDecisionWindow(extend(data, { slide: 'left' })));
  routePromise(Topics.FORWARD,  (data) => updateDecisionWindow(extend(data, { slide: 'right' })));
  routePromise(Topics.HOME,  (data) =>  Navigation.openController("Menu", data));
  routePromise(Topics.LOGIN,  (data) =>  Navigation.openController("LogIn", data));
  Topics.subscribe(Topics.LOGGEDIN,  (data) =>  Topics.fireTopicEvent(Topics.HOME, data));
  routePromise(Topics.BROWSE,  (data) =>   Navigation.openController("TaxonList", data));
  routePromise(Topics.SAMPLETRAY,  (data) =>   Navigation.openController("SampleTray", data));
  routePromise(Topics.IDENTIFY,  (data) =>   Navigation.openController("SampleTray", data));
  routePromise(Topics.SITEDETAILS,  (data) =>  siteDetailsWindow(data));
  routePromise(Topics.HABITAT,  (data) =>  Navigation.openController("Habitat", data));
  routePromise(Topics.COMPLETE,  (data) =>  Navigation.openController("Summary", data));
  routePromise(Topics.HISTORY,  (data) =>  Navigation.openController("SampleHistory", data));
  routePromise(Topics.SPEEDBUG,  (data) =>  Navigation.openController("Speedbug", data));
  routePromise(Topics.GALLERY,  (data) =>  Navigation.openController("Gallery", data));
  // routePromise( Topics.MAYFLY_EMERGENCE, (data) => openController("MayflyEmergenceMap",data) );
  routePromise(Topics.HELP,  (data) =>  Navigation.openController("Help", extend(data, { keyUrl: Key.url })));
  routePromise(Topics.ABOUT,  (data) =>  Navigation.openController("About", extend(data, { keyUrl: Key.url })));
  Topics.subscribe(Topics.FORCE_UPLOAD,  () => Survey.forceUpload());
  routePromise(Topics.NOTES,  (data) =>  Navigation.openController("Notes", data));
  routePromise(Topics.JUMPTO, async function (data) {
    if (!_.isUndefined(data.id)) {
      Key.setCurrentNode(data.id);
      await updateDecisionWindow(_(data).extend({ node: Key.getCurrentNode() }));
    } else {
      debug("Topics.JUMPTO undefined node!");
    }
  });

  Topics.subscribe(Topics.MAYFLY,  function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_MAYFLY);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });

  Topics.subscribe(Topics.ORDER, function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_ORDER);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });

  Topics.subscribe(Topics.DETAILED,  function (data) {
    if (!data) data = {};
    Survey.startSurvey(Sample.SURVEY_DETAILED);
    Topics.fireTopicEvent(Topics.SITEDETAILS, _(data).extend({ slide: "right" }));
  });
 await Navigation.openController("Menu", {});
}
exports.startApp = startApp;