const ChangeNotifier = require("../../util/ChangeNotifier");

// A sliding window onto a list of photos, so paging through a key's whole media
// set mounts a couple of dozen views rather than all of them. Titanium-free.
//
// The window is the model, not a set of instructions: an owner binds `pages` as a
// collection and lets the diff add and remove views, rather than reaching into a
// ScrollableView to insert and remove them by hand and then reassigning
// currentPage to compensate for what it just dropped.
//
// `currentPage` is an index into `pages`, so it moves whenever photos are added
// before the reader — keeping the same photo under them is this class's job.
class PhotoPagerViewModel extends ChangeNotifier {
  constructor({ photos, windowSize = 5, maxVisible = 20 }) {
    super();
    this._photos = photos;
    this._windowSize = windowSize;
    this._maxVisible = maxVisible;
    this._start = 0;
    this._count = Math.min(windowSize, photos.length);
    this._page = 0;
    this._pages = null;
  }

  // Rebuilt only when the window moves, so an owner binding this as a collection
  // sees stable children and the diff has nothing to do while the reader pages
  // within the window.
  get pages() {
    if (this._pages === null) {
      this._pages = this._photos
        .slice(this._start, this._start + this._count)
        .map((photo) => ({ key: keyOf(photo), url: urlOf(photo), taxon: taxonOf(photo) }));
    }
    return this._pages;
  }

  get currentPage() { return this._page; }

  // The reader moved to `page` within the current window. Extends the window if
  // they have reached either end of it, and reports whether anything changed.
  setPage(page) {
    if (page === this._page) { return; }
    this._page = page;
    if (page >= this._count - 1) {
      this._extendForwards();
    } else if (page === 0) {
      this._extendBackwards();
    }
    this._pages = null;
    this.notifyListeners();
  }

  _extendForwards() {
    const grown = Math.min(this._windowSize, this._photos.length - (this._start + this._count));
    if (grown === 0) { return; }
    this._count += grown;
    // Past the cap, the photos behind the reader go — which shifts every index,
    // so the page moves with them to keep the same photo in view.
    const over = Math.max(0, this._count - this._maxVisible);
    this._start += over;
    this._count -= over;
    this._page -= over;
  }

  _extendBackwards() {
    const grown = Math.min(this._windowSize, this._start);
    if (grown === 0) { return; }
    this._start -= grown;
    this._count += grown;
    this._page += grown;
    this._count = Math.min(this._count, this._maxVisible);
  }
}

// A photo is either a plain media path (the user's own files) or a {url, taxon}
// pair from the key. Only the latter has anywhere to navigate to; an owner that
// offers navigation reads `taxon`, and one that doesn't simply ignores it.
function urlOf(photo) { return typeof photo === "object" ? photo.url : photo; }
function taxonOf(photo) { return typeof photo === "object" ? photo.taxon : null; }
function keyOf(photo) { return urlOf(photo); }

module.exports = PhotoPagerViewModel;
