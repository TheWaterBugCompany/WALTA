const ChangeNotifier = require("../../util/ChangeNotifier");

// One page of the photo pager, built for whichever owner mounted it: the
// key-browsing Gallery or the media-zooming PhotoViewer. Titanium-free.
//
class GalleryPhotoViewModel extends ChangeNotifier {
  constructor(owner, page, photoSize, viewport) {
    super();
    this._owner = owner;
    this._page = page;
    this._photoSize = photoSize;
    this._viewport = viewport || null;
  }

  // Titanium will not fit a photo to a box: given both dimensions it stretches to
  // them, and what it does with only one set varies by platform and by what the
  // page happens to be mounted in. So the scaling is arithmetic here rather than
  // a layout Titanium is asked to infer — the same sum PhotoSelect.fitToView does.
  //
  // The box comes from the pager, not from the page's own frame. A page measuring
  // the surface it sits in and then resizing inside it feeds its own next reading:
  // on iOS that never settled and the screen never finished laying out.
  setViewport(size) {
    if (!size || !(size.width > 0) || !(size.height > 0)) { return; }
    if (this._viewport && this._viewport.width === size.width && this._viewport.height === size.height) { return; }
    this._viewport = size;
    this.notifyListeners();
  }

  // Scaled to fill the screen without cropping or distorting: the smaller of the
  // two ratios, so the photo grows until one dimension runs out. For a specimen
  // photo on a landscape-locked screen that is nearly always the height, but a
  // photo wider in proportion than the screen would run off its sides at full
  // height, and then the width is what binds.
  get _fitted() {
    var source = this._sourceSize();
    if (!this._viewport || !source) { return null; }
    var scale = Math.min(this._viewport.width / source.width, this._viewport.height / source.height);
    return { width: Math.round(source.width * scale), height: Math.round(source.height * scale) };
  }

  // Read once: a page is memoised against its photo, so its proportions never change.
  _sourceSize() {
    if (!this._source) { this._source = this._photoSize(this._page.url); }
    return this._source;
  }

  // Before the page has been measured it fills what it is in — a photo that has
  // not been laid out yet is better full-bleed for an instant than absent.
  get photoWidth() { return this._fitted ? this._fitted.width : "100%"; }
  get photoHeight() { return this._fitted ? this._fitted.height : "100%"; }

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
