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

    // Titanium force-rotates a window away from the landscape the interface is
    // already in when no device-orientation notification has arrived yet — a
    // still phone through a cold launch sends none, so a screen's first open
    // comes up a half turn out. See lib/ui/WindowOrientation.
    it("opens held to the landscape the interface is already in", async function () {
      await view.openView("About", ABOUT_ARGS);
      opened = view.getCurrentController();
      var win = opened.getView();
      expect(win.orientationModes).to.deep.equal([win.orientation]);
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
    // The real Academy controller gates Start on services.Training.isValidCode,
    // so the seam must hand it a Training service to build.
    var SERVICES = { Training: { isValidCode: () => false } };
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
      view.openModal("Academy", {}, SERVICES);
      var modal = view.getCurrentModal();
      expect(modal, "modal is tracked").to.exist;
      expect(modal.alloyCtl, "modal's Alloy controller").to.exist;
      view.closeModal();
      expect(view.getCurrentModal(), "modal cleared after close").to.not.exist;
    });

    // The DEFAULT registry is a hard require("mvvm/controllers/registry") →
    // require("./Academy"). This pins that the require chain resolves to the
    // real Ti-free lib controller (which builds a vm), not the Alloy shell —
    // the case LiveView used to mis-resolve.
    it("builds the real lib controller from the default registry", function () {
      view.openModal("Academy", {}, SERVICES);
      var modal = view.getCurrentModal();
      expect(modal.lib, "default registry built a lib controller").to.exist;
      expect(modal.lib.vm, "lib controller exposes its view-model").to.exist;
      view.closeModal();
    });
  });

  // createComponent is the seam a collection binding's `create` goes through:
  // it builds a child's Alloy controller + its lib controller and returns a
  // handle the caller adds to a container and disposes — never calling Alloy.
  describe("createComponent", function () {
    it("builds a child's Alloy controller and lib controller, disposed together", function () {
      var built = [];
      var fakeRegistry = {
        SampleHistoryRow: function (deps) {
          built.push(deps);
          return { marker: "row-lib", dispose: function () { built.disposed = true; } };
        },
      };
      var services = { screenControllers: fakeRegistry, marker: "svc" };
      var view = new View(services);
      var handle = view.createComponent("SampleHistoryRow", { rowVm: { sampleId: 7 } });

      expect(handle.view, "exposes the child view to add to a container").to.exist;
      expect(handle.lib, "built the lib controller").to.exist;
      expect(built.length, "lib factory invoked once").to.equal(1);
      expect(built[0].args, "handed the create args").to.deep.equal({ rowVm: { sampleId: 7 } });
      expect(built[0].services, "handed the services").to.equal(services);

      handle.dispose();
      expect(built.disposed, "disposed the lib controller").to.equal(true);
    });
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

    it("builds the lib controller from the injected registry, handing it the widgets, close, services, a pre-bound bindView and open args", function () {
      var services = { marker: "svc" };
      view.openModal("Academy", { probe: "arg" }, services);
      expect(calls.length, "injected factory invoked once").to.equal(1);
      expect(calls[0].view, "handed the Alloy widgets").to.equal(view.getCurrentModal().alloyCtl);
      expect(calls[0].close, "handed a close callback").to.be.a("function");
      expect(calls[0].services, "handed the services").to.equal(services);
      expect(calls[0].bindView, "handed a pre-bound binder").to.be.a("function");
      expect(calls[0].bindView.collection, "the binder carries the DSL markers").to.be.a("function");
      expect(calls[0].args, "handed the open args").to.deep.equal({ probe: "arg" });
    });

    it("disposes the injected lib controller on closeModal", function () {
      view.openModal("Academy", {}, {});
      view.closeModal();
      expect(calls.disposed, "lib.dispose() called").to.equal(true);
    });
  });

});
