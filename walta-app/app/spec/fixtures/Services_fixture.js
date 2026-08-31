var Topics = require("ui/Topics");
var Dialogs = require("logic/Dialogs");
var PlatformSpecific = require("logic/PlatformSpecific");
var { View } = require("logic/View");
var SampleHistorySource = require("logic/SampleHistorySource");
var PhotoUtils = require("util/PhotoUtils");

// A complete-enough services bag for specs that boot the app through a screen on
// the View seam. Screen controllers build their view-models from this bag, so it
// must carry the deps the app used to read from Ti globals
// (cerdiApi/topics/dialogs/environment/version). Pass overrides for the
// screen-specific collaborators (Key, Survey, System, ...).
//
// cerdiApi resolves lazily from Alloy.Globals so it tracks the instance specs
// set/mock, rather than whatever was in place when the bag was built.
function makeTestServices(overrides) {
  overrides = overrides || {};
  var services = Object.assign({
    System: {
      requestPermission: function () { return Promise.resolve({ success: true }); },
      closeApp: function () {},
    },
    topics: Topics,
    dialogs: Dialogs,
    platform: PlatformSpecific,
    photoSize: PhotoUtils.photoSize,
    environment: Alloy.CFG.environment,
    version: Ti.App.version,
  }, overrides);

  if (!("cerdiApi" in overrides)) {
    Object.defineProperty(services, "cerdiApi", {
      get: function () { return Alloy.Globals.CerdiApi; },
      enumerable: true,
    });
  }

  // The sample-history source reads Alloy models behind the seam the VM binds to
  // — provided here so a screen opened through the bag's View gets its data, the
  // same way index-app wires it. cerdiApi is read lazily inside loadAll, so the
  // instance specs mock is honoured.
  if (!("sampleSource" in overrides)) {
    services.sampleSource = SampleHistorySource({ cerdiApi: { retrieveUserId: function () { return services.cerdiApi.retrieveUserId(); } } });
  }

  // Screens created via the View seam build child components through
  // services.View (e.g. SampleHistory's rows), so the bag carries its own View —
  // as index-app does. Specs that construct their own View can overwrite it.
  if (!("View" in overrides)) {
    services.View = new View(services);
  }
  return services;
}

exports.makeTestServices = makeTestServices;
