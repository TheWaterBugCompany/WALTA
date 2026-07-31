const MenuViewModel = require("viewmodels/Menu");
const bindView = require("util/bindView");

// Titanium-free screen controller for the Menu window.
// See docs/patterns/screen-controllers.md for the pattern.
const BINDINGS = {
  appVersion:      { text: "versionLabel", color: "versionColor" },
  logInLabel:      { text: "loginLabel", accessibilityLabel: "loginLabel" },
  logInOrRegister: { onClick: "loginOrOut" },
  detailed:        { onClick: "detailed" },
  identify:        { onClick: "identify" },
  history:         { onClick: "history" },
  gallery:         { onClick: "gallery" },
  academy:         { onClick: "academy" },
  about:           { onClick: "about" },
};

module.exports = function createMenuController({ view, services, palette }) {
  const vm = new MenuViewModel({
    cerdiApi: services.cerdiApi,
    topics: services.topics,
    environment: services.environment,
    version: services.version,
  });
  const unbind = bindView(view, vm, BINDINGS, palette);

  // Route VM intents to the shell's residual-Titanium actions: identify opens
  // the MethodSelect overlay; confirmLogout shows the alert and, on confirm,
  // asks the VM to log out.
  vm.on("identify", () => view.openSelectMethod());
  vm.on("confirmLogout", () => view.confirmLogout(() => vm.logOut()));

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};
