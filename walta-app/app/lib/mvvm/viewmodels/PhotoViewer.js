const ChangeNotifier = require("../../util/ChangeNotifier");
const PhotoPagerViewModel = require("./PhotoPager");
const GalleryPhotoViewModel = require("./GalleryPhoto");
const PagerDotViewModel = require("./PagerDot");

// The media-zooming half of what Gallery.js does today: a pager over the user's
// own photo files, reached from the photo thumbnail rather than from the key.
//
// It composes the pager rather than inheriting it, and — the point of the split —
// it has no navigateTo. GalleryPhoto asks its owner for one, so no page built here
// can offer a way into the key, whatever shape its photos arrive in. The
// key-browsing screen is the one that offers it.
class PhotoViewerViewModel extends ChangeNotifier {
  constructor({ photos, topics, photoSize }) {
    super();
    this._topics = topics;
    this._photoSize = photoSize;
    this._pager = new PhotoPagerViewModel({ photos });
    this._pagesByKey = new Map();
    this._dots = photos.map((_, i) => new PagerDotViewModel(i));
  }

  // Rebuilt from the pager's window, but each photo keeps the page object it
  // already had — the collection binding keys on it, so a page still in view must
  // stay the same object or its view is torn down under the reader.
  get pages() {
    return this._pager.pages.map((page) => {
      if (!this._pagesByKey.has(page.key)) {
        this._pagesByKey.set(page.key, new GalleryPhotoViewModel(this, page, this._photoSize));
      }
      return this._pagesByKey.get(page.key);
    });
  }

  get currentPage() { return this._pager.currentPage; }
  get dots() { return this._dots; }
  get pagerVisible() { return this._dots.length > 1; }
  get accessibilityLabel() { return `Photo ${this.currentPage + 1}`; }

  setPage(page) {
    this._pager.setPage(page);
    this._dots.forEach((dot, i) => dot.setSelected(i === this.currentPage));
    this.notifyListeners();
  }

  close() { this._topics.fireTopicEvent(this._topics.BACK); }

  dispose() {
    this._pagesByKey.forEach((page) => page.dispose());
    this._pagesByKey.clear();
    this._dots.forEach((dot) => dot.dispose());
    super.dispose();
  }
}

module.exports = PhotoViewerViewModel;
