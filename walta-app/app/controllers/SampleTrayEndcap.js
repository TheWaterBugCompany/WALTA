var TrayHoleRenderer = require('logic/TrayHoleRenderer');

// Residual Titanium for the endcap: the (vertical) hole container plus the
// create/swap of hole content. The mvvm SampleTrayEndcap controller binds the
// geometry and drives renderHoles. See docs/patterns/screen-controllers.md.
var slots = [];

exports.renderHoles = function (holes, opts) {
  TrayHoleRenderer.renderHoles($.holeContainer, holes, slots, opts);
};

exports.cleanUp = function () {
  TrayHoleRenderer.disposeHoles(slots);
  $.destroy();
  $.off();
};
