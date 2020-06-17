var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var Topics = require('ui/Topics');
var { applyKeyboardTweaks } = require("ui/Layout");
var { emailValidity } = require("util/EmailUtils");

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Sign Up";

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var emailValid = false;
var passwordValid = false;

applyKeyboardTweaks( $, [ $.emailTextField, $.passwordTextField ]);

function emailChanged() {
    $.emailTextField.value = $.emailTextField.value.trim();
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
      $.enableControl($.logInButton);
    } else {
      $.disableControl($.logInButton);
    }

    if ( emailValid  ) {
      $.enableControl($.forgotPasswordButton);
    } else {
      $.disableControl($.forgotPasswordButton);
    }
  }

function loginClick() {
  $.activity.show();
  $.logInButton.visible = false;
  Alloy.Globals.CerdiApi.loginUser( $.emailTextField.value, $.passwordTextField.value )
      .then( (response ) => {
    $.activity.hide();
    $.logInButton.visible = true;
    log(`Logged in user ${$.emailTextField.value}`);
    Topics.fireTopicEvent( Topics.LOGGEDIN, null );
  }).catch( (err) => {
      $.activity.hide();
      $.logInButton.visible = true;
      Ti.API.error(`Unexpected error: ${JSON.stringify( err)}`);
      $.setError( $.emailTextField );
      $.setError( $.passwordTextField );
      $.setErrorMessage( err );
    });
}

function forgotPassword() {
  Alloy.Globals.CerdiApi.forgotPassword( $.emailTextField.value)
        .then( (response ) => {
      log(`Sent password reset for user ${$.emailTextField.value}`);
      alert(`A password reset request email has been sent to "${$.emailTextField.value}" check your email to continue password reset process, then come back here and log in with the new password.`)
;    }).catch( (err) => {
        Ti.API.error(`Unexpected error: ${JSON.stringify( err)}`);
        $.setError( $.emailTextField );
        $.setError( $.passwordTextField );
        $.setErrorMessage( err );
      });
}

function registerClick() {
    Alloy.createController("Register").open();
}
validateSubmit();