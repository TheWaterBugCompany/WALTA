

var Topics = require('ui/Topics');
var Sample = require('logic/Sample');
var { checkForErrors } = require('util/PromiseUtils');
var Logger = require('util/Logger');

var debug = (m, tag = "ui") => Logger.debug(m, tag);

var { System, Key, Survey, Training, Navigation } = $.args;
async function siteDetailsWindow(args) {
    await Navigation.openController("SiteDetails", args);
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
  // Session token rejected mid-sync: clear it and route to login to re-authenticate.
  Topics.subscribe(Topics.SESSION_EXPIRED, () => {
    Alloy.Globals.CerdiApi.storeUserToken(null, null);
    Topics.fireTopicEvent(Topics.LOGGEDOUT, null);
    Topics.fireTopicEvent(Topics.LOGIN, null);
  });
  routePromise(Topics.BROWSE,  (data) =>   Navigation.openController("TaxonList", data));
  routePromise(Topics.SAMPLETRAY,  (data) =>   Navigation.openController("SampleTray", data));
  // The session owns its tray and assessor, so a caller only has to ask for the
  // training tray — the anchor-bar tray button carries no session state of its own.
  function openTrainingTray(data) {
    return Navigation.openController("TrainingTray", extend(data, {
      tray: Training.currentTray(),
      assessor: Training.currentAssessor(),
    }));
  }
  routePromise(Topics.TRAININGTRAY, openTrainingTray);
  // A survey routes an identification through the EditTaxon overlay (data.taxonId
  // opens it). Training has no per-taxon editor: a fresh identification (no
  // sampleTaxonId) is added straight to the session tray, and the tray always
  // opens without a taxonId so the survey-only overlay never appears. Whether an
  // identification belongs to a training session rides on the threaded data.training
  // flag, so a finished training session can't leak into a later survey.
  routePromise(Topics.IDENTIFY,  (data) => {
    if (data.training) {
      if (data.sampleTaxonId != null) {
        // Tapping an existing taxon re-identifies it: reopen the method chooser
        // carrying its tray position, which threads through the key so the new
        // identification replaces it in that slot.
        return Navigation.openModal("MethodSelect", { training: true, allowAddToSample: true, surveyType: null, unknownBug: false, position: data.position });
      }
      Training.addTaxon(data.taxonId, data.position);
      return openTrainingTray();
    }
    return Navigation.openController("SampleTray", data);
  });
  routePromise(Topics.SITEDETAILS,  (data) =>  siteDetailsWindow(data));
  routePromise(Topics.HABITAT,  (data) =>  Navigation.openController("Habitat", data));
  routePromise(Topics.COMPLETE,  (data) =>  Navigation.openController("Summary", data));
  routePromise(Topics.HISTORY,  (data) =>  Navigation.openController("SampleHistory", data));
  routePromise(Topics.SPEEDBUG,  (data) =>  Navigation.openController("Speedbug", data));
  routePromise(Topics.GALLERY,  (data) =>  Navigation.openController("Gallery", data));
  // openModal does not thread the survey context the way onOpenView does, so the
  // key this screen resolves both taxa through is supplied here.
  routePromise(Topics.TAXON_COMPARISON, (data) => Navigation.openModal("TaxonComparison", extend(data, { key: Key })));
  routePromise(Topics.PHOTO_VIEWER,  (data) =>  Navigation.openController("PhotoViewer", data));
  routePromise(Topics.HELP,  (data) =>  Navigation.openController("Help", extend(data, { keyUrl: Key.url })));
  routePromise(Topics.ABOUT,  (data) =>  Navigation.openController("About", extend(data, { keyUrl: Key.url })));
  routePromise(Topics.ACADEMY,  () =>  Navigation.openModal("Academy"));
  routePromise(Topics.SELECT_METHOD,  (data) =>  Navigation.openModal("MethodSelect", data));
  routePromise(Topics.TRAINING_SUCCESS,  (data) =>  Navigation.openModal("TrainingSuccess", data));
  routePromise(Topics.EDIT_SAMPLE,  (data) =>  Navigation.openModal("SampleEditMenu", data));
  routePromise(Topics.START_SYNC,  () =>  Navigation.openModal("SyncFeedback"));
  Topics.subscribe(Topics.FORCE_UPLOAD,  () => Survey.uploadNewSample());
  routePromise(Topics.NOTES,  (data) =>  Navigation.openController("Notes", data));
  routePromise(Topics.JUMPTO, async function (data) {
    if (!_.isUndefined(data.id)) {
      Key.setCurrentNode(data.id);
      await updateDecisionWindow(_(data).extend({ node: Key.getCurrentNode() }));
    } else {
      debug("Topics.JUMPTO undefined node!");
    }
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