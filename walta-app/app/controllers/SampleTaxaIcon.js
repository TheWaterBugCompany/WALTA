var bindView = require('util/bindView');
var Topics = require('ui/Topics');

// A tray icon cell. The Titanium-free SampleTaxaIconViewModel (a hole's iconVm)
// carries the silhouette / abundance / accessibility label; bind() wires them.
// The cell owns its own edit tap and fires the IDENTIFY intent itself, so the
// tray needs no per-cell wiring — mirrors SampleHistoryRow's "row owns its
// intent". See docs/patterns/screen-controllers.md.
var vm = null;
var readOnlyMode = false;
var teardown = null;

exports.bind = function (iconVm, opts) {
  vm = iconVm;
  readOnlyMode = !!(opts && opts.readonly);
  var unbind = bindView($, iconVm, {
    icon:          { image: "image" },
    abundance:     { text: "abundanceText", visible: "abundanceVisible" },
    SampleTaxaIcon: { accessibilityLabel: "accessibilityLabel" },
  });
  // On iOS a tap whose hit-test target is a Ti view with no click listener does
  // not raise a click that bubbles to ancestors — so the silhouette ImageView
  // (what a tap actually lands on) needs the handler directly. The cell root
  // also carries it (for taps off the image and for synthetic clicks in specs);
  // cancelBubble keeps a real image tap to a single fire.
  $.icon.addEventListener("click", onClick);
  $.SampleTaxaIcon.addEventListener("click", onClick);
  teardown = function () {
    $.icon.removeEventListener("click", onClick);
    $.SampleTaxaIcon.removeEventListener("click", onClick);
    unbind();
  };
  return teardown;
};

function onClick(e) {
  fireEditEvent();
  if (e) e.cancelBubble = true;
}

function fireEditEvent() {
  Topics.fireTopicEvent(Topics.IDENTIFY, { sampleTaxonId: vm.sampleTaxonId, readonly: readOnlyMode });
}

function cleanUp() {
  if (teardown) teardown();
  $.destroy();
  $.off();
}

exports.fireEditEvent = fireEditEvent;
exports.cleanUp = cleanUp;
