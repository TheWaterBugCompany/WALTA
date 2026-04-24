// Loads an Alloy Model file (`app/models/<name>.js`) under Node and
// returns a runnable Backbone.Model subclass with `extendModel`
// applied. Lets VM-shaped Alloy Models be unit-tested at Node speed
// without the Titanium/Alloy runtime.
//
// The loaded model file MUST:
// - accept its collaborators via `initialize(attrs, options)` (no
//   eager top-level requires of Titanium-only modules);
// - not depend on the SQL/Properties adapter at construct time
//   (Alloy's adapter layer is not present here).
//
// Usage:
//   const buildModel = require('../helpers/alloyModel');
//   const SyncFeedback = buildModel('syncFeedback');
//   const vm = new SyncFeedback({}, { syncController: fake });

const Backbone = require('backbone');
const path = require('path');

const MODELS_DIR = path.resolve(__dirname, '../../walta-app/app/models');

module.exports = function buildAlloyModel(name) {
  const modelModule = require(path.join(MODELS_DIR, name + '.js'));
  const { definition } = modelModule;
  if (!definition || typeof definition.extendModel !== 'function') {
    throw new Error(`Model "${name}" has no extendModel definition`);
  }
  const BaseModel = Backbone.Model.extend({});
  return definition.extendModel(BaseModel);
};
