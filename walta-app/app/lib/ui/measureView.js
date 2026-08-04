// Titanium presenter helper: reliably read a view's laid-out size, working
// around Titanium firing `postlayout` before the view has a usable frame — a
// zero or throwing `.size` read mid window-transition. On `postlayout`, poll the
// size until it is usable, then hand it to `onSize` once; returns a teardown that
// cancels any pending retry and detaches the event.
//
// This is the one Titanium-specific layout hack the SampleTray needs. It lives in
// the presenter layer (an Alloy controller drives it) so it stays out of the
// portable ViewModel / bindView surface — the ViewModel just receives a clean size.
const INTERVAL = 100;
const MAX_ATTEMPTS = 30;

function usable(size) {
  return !!(size && size.height > 0);
}

module.exports = function measureView(view, onSize) {
  let timer = null;

  function read() {
    try { return view.size; } catch (e) { return undefined; }
  }

  function poll(attempt) {
    const size = read();
    if (usable(size)) {
      onSize({ width: size.width, height: size.height });
      return;
    }
    if (attempt < MAX_ATTEMPTS) {
      timer = setTimeout(function () { poll(attempt + 1); }, INTERVAL);
    }
  }

  function onLayout() { poll(0); }
  view.addEventListener("postlayout", onLayout);

  return function stop() {
    if (timer) clearTimeout(timer);
    view.removeEventListener("postlayout", onLayout);
  };
};
