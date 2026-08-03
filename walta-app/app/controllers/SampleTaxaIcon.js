var bindView = require('util/bindView');
var Topics = require('ui/Topics');

// A tray icon cell. The Titanium-free SampleTaxaIconViewModel (a hole's iconVm)
// carries the silhouette / abundance / accessibility label; bind() wires them.
// The cell owns its own edit tap, firing IDENTIFY with the taxon's sampleTaxonId
// — the tray needs no per-cell wiring. See docs/patterns/screen-controllers.md.
var vm = null;
var readOnlyMode = false;

exports.bind = function (iconVm, opts) {
  vm = iconVm;
  readOnlyMode = !!(opts && opts.readonly);
  return bindView($, iconVm, {
    icon:          { image: "image" },
    abundance:     { text: "abundanceText", visible: "abundanceVisible" },
    SampleTaxaIcon: { accessibilityLabel: "accessibilityLabel" },
  });
};

function fireEditEvent() {
  Topics.fireTopicEvent(Topics.IDENTIFY, { sampleTaxonId: vm.sampleTaxonId, readonly: readOnlyMode });
}

function cleanUp() {
  $.destroy();
  $.off();
}

exports.fireEditEvent = fireEditEvent;
exports.cleanUp = cleanUp;
