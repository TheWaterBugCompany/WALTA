const { fit } = require("util/bindView");

// Titanium-free component controller for one page of the photo pager. Binds the
// photo, and the taxon name the key-browsing owner asked for. Photo and label
// share the one gesture — a media-viewing owner's VM refuses it. The VM owns the
// navigation intent, so neither screen wires anything per photo.
// See docs/patterns/screen-controllers.md.
module.exports = function createGalleryPhoto({ view, args, bindView }) {
  const unbind = bindView(view, args.rowVm, {
    // The box comes from the pager that built this page, not from anything here.
    photo:      { image: "image", size: fit("image", args.box), onClick: "tap" },
    taxonLabel: { text: "taxonName", visible: "labelVisible", accessibilityLabel: "accessibilityLabel", onClick: "tap" },
  });
  return { dispose: unbind };
};
