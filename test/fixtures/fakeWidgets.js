// Fake widgets for Node controller specs — the settable-props + event surface a
// bindView-driven screen controller talks to, with no Titanium.
//
//   makeWidget(props)     — a Ti widget: your initial props plus
//                           addEventListener/removeEventListener/fireEvent.
//   makeBackboneTarget()  — an Alloy <Require> sub-controller: on/off/trigger.

function makeWidget(props) {
  const listeners = {};
  return Object.assign({
    addEventListener(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    removeEventListener(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    fireEvent(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  }, props);
}

function makeBackboneTarget() {
  const listeners = {};
  return {
    on(name, cb) { (listeners[name] = listeners[name] || []).push(cb); },
    off(name, cb) { listeners[name] = (listeners[name] || []).filter(l => l !== cb); },
    trigger(name, data) { (listeners[name] || []).slice().forEach(cb => cb(data)); },
  };
}

module.exports = { makeWidget, makeBackboneTarget };
