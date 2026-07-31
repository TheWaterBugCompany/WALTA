require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { View } = require("logic/View");
var { closeWindow } = require("spec/util/TestUtils");

// About is the lightest TopLevelWindow — enough to exercise the seam's window
// lifecycle without dragging in a screen's data dependencies.
var ABOUT_ARGS = { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" };

// View is the Titanium orchestration seam: it opens/closes windows and modals
// and (for a registered name) instantiates the Ti-free lib/mvvm/controllers/<name>
// that drives the binding. These specs pin that behaviour before it grows to
// drive windows too. See docs/patterns/modals.md and the north-star.
describe("View seam", function () {

  describe("openView", function () {
    var view, opened;
    beforeEach(function () { view = new View({}); });
    afterEach(async function () {
      if (opened) { await closeWindow(opened.getView()); opened = null; }
    });

    it("opens the window and tracks it as the current controller", async function () {
      await view.openView("About", ABOUT_ARGS);
      opened = view.getCurrentController();
      expect(opened, "current controller is tracked").to.exist;
      expect(opened.getName()).to.equal("About");
    });
  });

  // A window gets the same treatment as a modal: if a screen controller is
  // registered for it, openView instantiates it (driving the binding) and
  // disposes it when the window closes.
  describe("openView lib controller", function () {
    it("builds the window's lib controller on open and disposes it on close", async function () {
      var calls = [];
      var fakeRegistry = {
        About: function (deps) { calls.push(deps); return { dispose: function () { calls.disposed = true; } }; }
      };
      var view = new View({ screenControllers: fakeRegistry });
      await view.openView("About", ABOUT_ARGS);
      expect(calls.length, "lib controller built on open").to.equal(1);
      expect(calls[0].view, "handed the window's Alloy controller").to.equal(view.getCurrentController());
      expect(calls[0].services, "handed the services").to.exist;

      await closeWindow(view.getCurrentController().getView());
      expect(calls.disposed, "lib controller disposed on window close").to.equal(true);
    });
  });

  describe("openModal", function () {
    var view, host;
    beforeEach(async function () {
      view = new View({});
      await view.openView("About", ABOUT_ARGS);
      host = view.getCurrentController();
    });
    afterEach(async function () {
      view.closeModal();
      if (host) { await closeWindow(host.getView()); host = null; }
    });

    it("overlays the modal on the current window and clears it on close", function () {
      view.openModal("Academy", {}, {});
      var modal = view.getCurrentModal();
      expect(modal, "modal is tracked").to.exist;
      expect(modal.alloyCtl, "modal's Alloy controller").to.exist;
      view.closeModal();
      expect(view.getCurrentModal(), "modal cleared after close").to.not.exist;
    });
    // NB: the DEFAULT registry (hard require) resolving a lib controller is
    // verified in a real bundle build, not here — LiveView can't reliably serve
    // the mvvm/controllers require chain. The injected-registry tests below
    // cover the seam robustly (and injection is the north-star path anyway).
  });

  // The registry is injectable so the seam can be tested with a fake lib
  // controller — the mechanism the generalized openView (windows) will reuse.
  describe("injectable screen-controller registry", function () {
    var view, host, calls;
    beforeEach(async function () {
      calls = [];
      var fakeRegistry = {
        Academy: function (deps) {
          calls.push(deps);
          return { vm: {}, dispose: function () { calls.disposed = true; } };
        }
      };
      view = new View({ screenControllers: fakeRegistry });
      await view.openView("About", ABOUT_ARGS);
      host = view.getCurrentController();
    });
    afterEach(async function () {
      view.closeModal();
      if (host) { await closeWindow(host.getView()); host = null; }
    });

    it("builds the lib controller from the injected registry, handing it the widgets, close, services and palette", function () {
      var services = { marker: "svc" };
      view.openModal("Academy", {}, services);
      expect(calls.length, "injected factory invoked once").to.equal(1);
      expect(calls[0].view, "handed the Alloy widgets").to.equal(view.getCurrentModal().alloyCtl);
      expect(calls[0].close, "handed a close callback").to.be.a("function");
      expect(calls[0].services, "handed the services").to.equal(services);
      expect(calls[0].palette, "handed the colour palette").to.exist;
    });

    it("disposes the injected lib controller on closeModal", function () {
      view.openModal("Academy", {}, {});
      view.closeModal();
      expect(calls.disposed, "lib.dispose() called").to.equal(true);
    });
  });

});
