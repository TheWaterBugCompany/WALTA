var Topics = require('ui/Topics');
var { applyKeyboardTweaks } = require("ui/Layout");
var { emailValidity } = require("util/EmailUtils");

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Sign Up";

var emailValid = false;
var passwordValid = false;

applyKeyboardTweaks( $, [ $.emailTextField, $.passwordTextField ]);

function emailChanged() {
    if ( emailValidity($.emailTextField.value) ) {
        $.clearError( $.emailTextField );
        emailValid = true;
    } else {
        $.setError( $.emailTextField );
        emailValid = false;
    }
    validateSubmit();
}

function passwordChanged() {
    if ( $.passwordTextField.value.length > 0 ) {
          $.clearError($.passwordTextField);
          passwordValid = true;
         }
    else {
      $.setError($.passwordTextField);
      passwordValid = false;
    }
    validateSubmit();
}

function validateSubmit() {
    if ( emailValid && passwordValid ) {
      $.enable($.logInButton);
    } else {
      $.disable($.logInButton);
    }
  }

function loginClick() {
    Alloy.Globals.CerdiApi.loginUser( $.emailTextField.value, $.passwordTextField.value )
        .then( (response ) => {
      Ti.API.debug(`Logged in user ${$.emailTextField.value}`);
      Topics.fireTopicEvent( Topics.LOGGEDIN, null );
    }).catch( (err) => {
        Ti.API.error(`Unexpected error: ${JSON.stringify( err)}`);
        $.setError( $.emailTextField );
        $.setError( $.passwordTextField );
        $.setErrorMessage( err );
      });
}

function registerClick() {
    Alloy.createController("Register").open();
}
$.disable($.logInButton);