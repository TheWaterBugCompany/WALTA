// Titanium-free component controller for one page of the photo pager. Binds the
// photo, and the taxon name the key-browsing owner asked for — a media-viewing
// owner leaves the label hidden, so the page has nothing to tap. The VM owns the
// navigation intent, so neither screen wires anything per photo.
// See docs/patterns/screen-controllers.md.
const { measure } = require("util/bindView");

const BINDINGS = {
  zoom:       { onPostlayout: measure("setViewport", "size") },
  photo:      { image: "image", height: "photoHeight" },
  taxonLabel: { text: "taxonName", visible: "labelVisible", accessibilityLabel: "accessibilityLabel", onClick: "tap" },
};

module.exports = function createGalleryPhoto({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, BINDINGS);
  return { dispose: unbind };
};
