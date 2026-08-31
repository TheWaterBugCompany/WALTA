const ChangeNotifier = require("../../util/ChangeNotifier");

// One page of the photo pager, built for whichever owner mounted it: the
// key-browsing Gallery or the media-zooming PhotoViewer. Titanium-free.
//
class GalleryPhotoViewModel extends ChangeNotifier {
  constructor(owner, page) {
    super();
    this._owner = owner;
    this._page = page;
    this._viewport = null;
  }

  // Titanium will not fit a photo to a box: an ImageView given both dimensions
  // stretches to them. Given a *number* for one and left to work out the other it
  // keeps the photo's proportions — so the page reports the height it has and the
  // photo takes it, which is what the screen did before it was a component.
  setViewport(size) {
    if (!size || !(size.height > 0) || (this._viewport && this._viewport.height === size.height)) { return; }
    this._viewport = size;
    this.notifyListeners();
  }

  get photoHeight() { return this._viewport ? this._viewport.height : "100%"; }

  // The component the collection builds for this page, and the key it diffs on —
  // the photo's own url, so a window that slides keeps the views it still holds.
  get component() { return "GalleryPhoto"; }
  get key() { return this._page.key; }

  get image() { return this._page.url; }

  get taxonName() { return this._page.taxon ? this._page.taxon.name : ""; }

  // Both halves matter: an owner willing to navigate and a photo that carries
  // somewhere to navigate to.
  get labelVisible() {
    return typeof this._owner.navigateTo === "function" && this._page.taxon != null;
  }

  get accessibilityLabel() {
    return this.labelVisible ? `Show ${this.taxonName}` : "";
  }

  tap() {
    if (!this.labelVisible) { return; }
    this._owner.navigateTo(this._page.taxon);
  }
}

module.exports = GalleryPhotoViewModel;
