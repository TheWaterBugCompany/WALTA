const { collection, input } = require("util/bindView");
const PhotoViewerViewModel = require("mvvm/viewmodels/PhotoViewer");

// Titanium-free screen controller for the photo viewer: a pager over the photos
// the caller handed it, and the dots that say where in them the reader is.
//
// The pages are GalleryPhoto components, the same ones the key-browsing Gallery
// mounts — they name a taxon only when their owner offers navigation, and this
// view-model offers none. See docs/patterns/screen-controllers.md.
const BINDINGS = {
  scrollView: {
    // The pager's own frame is the box each page is fitted to: measured above the
    // pages, so a page resizing inside it cannot feed its own next reading.
    pages:              collection("pages", "GalleryPhoto", "size"),
    currentPage:        "currentPage",
    accessibilityLabel: "accessibilityLabel",
    onScrollend:        input("setPage", "currentPage"),
  },
  pager: {
    dots:    collection("dots", "PagerDot"),
    visible: "pagerVisible",
  },
  closeButton: { onClose: "close" },
};

module.exports = function createPhotoViewerController({ view, services, bindView, args }) {
  const vm = new PhotoViewerViewModel({ photos: args.photos, topics: services.topics });
  const unbind = bindView(view, vm, BINDINGS);
  return {
    vm,
    dispose() { unbind(); vm.dispose(); },
  };
};
