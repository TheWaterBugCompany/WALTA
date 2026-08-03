var PlatformSpecific = require('logic/PlatformSpecific');
var Topics = require('ui/Topics');
var SampleTraySource = require('logic/SampleTraySource');
var { attemptLayout } = require('util/TiHacks');

// Residual Titanium shell for the ice-cube tray. The Ti-free
// lib/mvvm/controllers/SampleTray (built by View.openView) owns the view-model
// and declares the two tray collections (endcap + windowed tiles); the injected
// bindView materialises the cells. All that lives here is the Titanium the port
// can't shed: measuring the viewport, driving scroll offsets into the VM,
// scrolling to the right edge, and the EditTaxon overlay. Geometry math lives in
// the VM. See docs/patterns/screen-controllers.md.

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

var readOnlyMode = $.args.readonly === true;
var key = $.args.key;

// Model reads live behind the source seam, not in the shell body, so the VM
// stays Node-testable.
var taxaSource = SampleTraySource(Alloy.Collections["taxa"], key, readOnlyMode);
exports.getTaxaSource = function () { return taxaSource; };

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HABITAT, slide: "left", readonly: readOnlyMode });
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.NOTES, slide: "right", readonly: readOnlyMode });
acb.addTool($.backButton.getView());
acb.addTool($.nextButton.getView());

var vm = null;

function viewportDip() {
  return {
    width: PlatformSpecific.convertSystemToDip($.content.size.width),
    height: PlatformSpecific.convertSystemToDip($.content.size.height),
  };
}

function scrollOffsetDip() {
  return PlatformSpecific.convertSystemToDip($.content.contentOffset.x);
}

// The mvvm controller hands us the VM after wiring the collection bindings; the
// shell then drives the Titanium side into it.
exports.attachViewModel = function (viewModel) {
  vm = viewModel;
  $.content.addEventListener("scroll", onScroll);
  Alloy.Collections["taxa"].on("add change remove", onTaxaChanged);
  $.content.addEventListener("postlayout", onFirstLayout);
};

function onScroll() {
  if (!vm) return;
  vm.setScrollOffset(scrollOffsetDip());
  $.trigger("trayupdated");
}

function onTaxaChanged() {
  vm.refresh();
  $.trigger("trayupdated");
  scrollToRightEdge();
}

// content's 'postlayout' can fire mid window-transition, when the current
// activity is transiently null and reading .size throws getWindow()-on-null.
// attemptLayout swallows that; content's postlayout is one-shot and won't
// re-fire, so poll briefly until the activity is attached and the size-dependent
// layout actually renders.
function onFirstLayout() {
  $.content.removeEventListener("postlayout", onFirstLayout);
  initTrayWhenAttached();
}

function initTrayWhenAttached(attempt) {
  attempt = attempt || 0;
  var ready = false;
  var done = attemptLayout(function () { ready = initializeTray(); });
  if ((!done || !ready) && attempt < 30) {
    setTimeout(function () { initTrayWhenAttached(attempt + 1); }, 100);
  }
}

function initializeTray() {
  var dims = viewportDip();
  if (!dims.height) return false; // size not laid out yet — retry
  vm.setViewport(dims);
  $.trigger("trayupdated");
  scrollToRightEdge();
  return true;
}

function scrollToRightEdge() {
  var rightEdge = PlatformSpecific.convertDipToSystem(vm.trayWidth - vm.viewWidth);
  return new Promise(function (resolve) {
    if (rightEdge <= 0) { setTimeout(resolve, 5); return; }
    var fallback;
    function isAtScrollX(e) {
      if (Math.abs(e.x - rightEdge) < 2.0) {
        clearTimeout(fallback);
        $.content.removeEventListener("scroll", isAtScrollX);
        setTimeout(resolve, 5);
      }
    }
    $.content.addEventListener("scroll", isAtScrollX);
    fallback = setTimeout(function () {
      $.content.removeEventListener("scroll", isAtScrollX);
      resolve();
    }, 2000);
    setTimeout(function () { $.content.scrollTo(rightEdge, 0, { animate: true }); }, 0);
  }).then(function () { $.trigger("scrollrightend"); });
}

function closeEditScreen() {
  if (typeof $.editTaxon === "object") {
    $.getView().remove($.editTaxon.getView());
    $.editTaxon.cleanUp();
    delete $.editTaxon;
  }
}

function editTaxon() {
  $.editTaxon = Alloy.createController("EditTaxon", $.args);
  $.getView().add($.editTaxon.getView());
  $.editTaxon.on("close", function () {
    // closes but leaves temporary state untouched
    closeEditScreen();
  });
  $.editTaxon.on("save", function () {
    $.trigger("taxonSaved");
  });
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  closeEditScreen();
  $.content.removeEventListener("scroll", onScroll);
  $.content.removeEventListener("postlayout", onFirstLayout);
  Alloy.Collections["taxa"].off("add change remove", onTaxaChanged);
  $.TopLevelWindow.removeEventListener('close', cleanUp);
});

if (!_.isUndefined($.args.taxonId) || !_.isUndefined($.args.sampleTaxonId)) {
  $.TopLevelWindow.addEventListener("open", editTaxon);
  $.TopLevelWindow.addEventListener("close", function closeWindow() {
    $.TopLevelWindow.removeEventListener("open", editTaxon);
    $.TopLevelWindow.removeEventListener("close", closeWindow);
  });
}

exports.editTaxon = editTaxon;
exports.getTrayWidth = function () { return vm.trayWidth; };
exports.getViewWidth = function () { return vm.viewWidth; };
