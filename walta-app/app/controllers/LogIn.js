function registerClick() {
    Alloy.createController("Register");
}
Ti.API.info( "user token: " + Alloy.Globals.CerdiApi.retrieveUserToken() );
Alloy.createController("TopLevelWindow", {
    name: 'login',
    title: 'Log In',
    uiObj: { view: $.getView() }
  });