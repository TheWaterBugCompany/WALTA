var Topics = require('ui/Topics');
function loginClick() {
    Alloy.Globals.CerdiApi.loginUser( $.emailTextField.value, $.passwordTextField.value )
        .then( (response ) => {
      Ti.API.info(`Logged in user ${$.emailTextField.value}`);
      Topics.fireTopicEvent( Topics.HOME, null );
    }).catch( (err) => {
        Ti.API.error(`Unexpected error: ${JSON.stringify( err)}`);
      });
}

function registerClick() {
    Alloy.createController("Register");
}

Alloy.createController("TopLevelWindow", {
    name: 'login',
    title: 'Log In',
    uiObj: { view: $.getView() }
  });