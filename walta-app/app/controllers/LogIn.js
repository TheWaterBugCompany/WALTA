function registerClick() {
    Alloy.createController("Register");
}

Alloy.createController("TopLevelWindow", {
    name: 'login',
    title: 'Log In',
    uiObj: { view: $.getView() }
  });