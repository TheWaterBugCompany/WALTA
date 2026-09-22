const AccountViewModel = require("mvvm/viewmodels/Account");
// Markers only — the binder itself is injected (pre-bound by the View seam);
// these are needed here at module scope to build BINDINGS.
const { collection } = require("util/bindView");

// Titanium-free screen controller for the Account Details window.
// See docs/patterns/screen-controllers.md.
const BINDINGS = {
  emailValue:     { text: "email" },
  nameValue:      { text: "name" },
  beltGrid:       { belts: collection("belts", "Belt") },
  logOutButton:   { onClick: "logOut" },
  deleteButton:   { onClick: "deleteAccount" },
};

module.exports = function createAccountController({ view, services, bindView }) {
  const vm = new AccountViewModel({
    cerdiApi: services.cerdiApi,
    topics: services.topics,
    level: services.belts ? services.belts.currentLevel() : 0,
  });
  const unbind = bindView(view, vm, BINDINGS);

  // Confirm the logout through the native-dialog seam; the VM owns what
  // happens once it comes back.
  vm.on("confirmLogOut", async () => {
    const confirmed = await services.dialogs.confirm({
      title: "Confirm Log Out",
      message: "Are you sure you want to log out?",
      confirmLabel: "Log Out",
    });
    if (confirmed) vm.completeLogOut();
  });

  vm.load();

  return {
    vm,
    dispose() {
      unbind();
      vm.dispose();
    },
  };
};
