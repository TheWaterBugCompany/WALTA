var Topics = require("ui/Topics");
var Dialogs = require("logic/Dialogs");

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
    environment: Alloy.CFG.environment,
    version: Ti.App.version,
  }, overrides);

  if (!("cerdiApi" in overrides)) {
    Object.defineProperty(services, "cerdiApi", {
      get: function () { return Alloy.Globals.CerdiApi; },
      enumerable: true,
    });
  }
  return services;
}

exports.makeTestServices = makeTestServices;
