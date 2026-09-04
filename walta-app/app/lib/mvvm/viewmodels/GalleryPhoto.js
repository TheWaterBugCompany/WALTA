const ChangeNotifier = require("../../util/ChangeNotifier");

// One page of the photo pager, built for whichever owner mounted it: the
// key-browsing Gallery or the media-zooming PhotoViewer. Titanium-free.
//
// How big the photo is drawn is not here: the component fits it to the box the
// pager measured, through bindView's fit marker.
class GalleryPhotoViewModel extends ChangeNotifier {
  constructor(owner, page) {
    super();
    this._owner = owner;
    this._page = page;
  }

  // The component the collection builds for this page, and the key it diffs on —
  // the photo's own url, so a window that slides keeps the views it still holds.
  get component() { return "GalleryPhoto"; }
  get key() { return this._page.key; }

  get image() { return this._page.url; }

  get taxonName() { return this._page.taxon ? this._page.taxon.name : ""; }

  // Both halves matter: an owner willing to navigate and a photo that carries
  // somewhere to navigate to.
  get navigable() {
    return typeof this._owner.navigateTo === "function" && this._page.taxon != null;
  }

  get labelVisible() { return this.navigable; }

  get accessibilityLabel() {
    return this.navigable ? `Show ${this.taxonName}` : "";
  }

  tap() {
    if (!this.navigable) { return; }
    this._owner.navigateTo(this._page.taxon);
  }
}

module.exports = GalleryPhotoViewModel;
