var Topics = require('ui/Topics');

// The residual Titanium for a tray cell's holes: creates the hole containers
// once and swaps their content when a hole changes kind. Driven by the VM's
// hole descriptors ({ kind, iconVm }); a taxon that stays a taxon is left alone
// (its bound iconVm updates the icon in place — no flicker, positional reuse).
// The VM owns which kind each hole is; this only realises it in Ti.

function createIconContainer(holeWidthCss) {
  return Ti.UI.createView({ top: 0, width: holeWidthCss, height: "50%" });
}

function createAddButton() {
  return Ti.UI.createButton({
    top: "40%",
    left: "25%",
    width: "50%",
    height: "36%",
    accessibilityLabel: "Add Sample",
    backgroundImage: "/images/plus-icon.png",
  });
}

// The plus / add-behind cells open the identification-method chooser to add to
// the current sample. surveyType comes from the live sample model (Ti).
function fireSelectMethod(e) {
  var surveyType = parseInt(Alloy.Models.sample.get("surveyType"));
  Topics.fireTopicEvent(Topics.SELECT_METHOD, { allowAddToSample: true, surveyType: surveyType, unknownBug: true });
  if (e) e.cancelBubble = true;
}

function clearSlot(slot) {
  if (slot.clickHandler) {
    slot.container.removeEventListener("click", slot.clickHandler);
    slot.clickHandler = null;
  }
  if (slot.plusButton) {
    slot.plusButton.removeEventListener("click", fireSelectMethod);
    slot.plusButton = null;
  }
  if (slot.iconCtl) {
    slot.iconCtl.cleanUp();
    slot.iconCtl = null;
  }
  slot.container.removeAllChildren();
}

function renderTaxon(slot, iconVm, readonly) {
  clearSlot(slot);
  var iconCtl = Alloy.createController("SampleTaxaIcon", {});
  // The icon owns its own tap (wired inside bind, on the view that carries the
  // accessibilityLabel), so the hole container needs no click handler here.
  iconCtl.bind(iconVm, { readonly: readonly });
  slot.container.add(iconCtl.getView());
  slot.iconCtl = iconCtl;
}

function renderPlus(slot) {
  clearSlot(slot);
  // The click lives on the button itself (as the old createAddIcon did): on
  // Android a synthetic fireEvent on the button doesn't bubble to a container
  // handler, so the plus tap would be lost.
  var button = createAddButton();
  button.addEventListener("click", fireSelectMethod);
  slot.plusButton = button;
  slot.container.add(button);
}

function renderAddBehind(slot) {
  clearSlot(slot);
  slot.clickHandler = fireSelectMethod;
  slot.container.addEventListener("click", slot.clickHandler);
}

function reconcileHole(slot, hole, opts) {
  // A taxon that stays a taxon needs no Ti work: the bound iconVm already
  // updated the icon. Every other transition rebuilds the cell content.
  if (slot.kind === "taxon" && hole.kind === "taxon") return;
  if (slot.kind === hole.kind && hole.kind !== "taxon") return;

  if (hole.kind === "taxon") renderTaxon(slot, hole.iconVm, opts.readonly);
  else if (hole.kind === "plus") renderPlus(slot);
  else if (hole.kind === "addBehind") renderAddBehind(slot);
  else clearSlot(slot); // blank

  slot.kind = hole.kind;
}

// Reconciles `container`'s hole views against `holes`, using `slots` as the
// persistent per-position cache (create-once, swap-content). opts:
// { holeWidthCss, readonly }.
function renderHoles(container, holes, slots, opts) {
  holes.forEach(function (hole, j) {
    var slot = slots[j];
    if (!slot) {
      slot = slots[j] = { kind: null, container: createIconContainer(opts.holeWidthCss) };
      container.add(slot.container);
    } else {
      // A cell created before the viewport was measured (the endcap materialises
      // at bind time) re-applies its width once setViewport lands.
      slot.container.width = opts.holeWidthCss;
    }
    reconcileHole(slot, hole, opts);
  });
}

function disposeHoles(slots) {
  slots.forEach(clearSlot);
  slots.length = 0;
}

exports.renderHoles = renderHoles;
exports.disposeHoles = disposeHoles;
