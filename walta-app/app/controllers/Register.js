var Topics = require("ui/Topics");
var { emailValidity } = require("util/EmailUtils");

var emailValid = false;
var nameValid = false;
var passwordValid = false;

$.TopLevelWindow.title = "Register";
exports.baseController = "TopLevelWindow";

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.emailTextField, $.nameTextField, $.passwordTextField, $.passwordConfirmTextField ] );


function emailChanged() {
  if ( emailValidity($.emailTextField.value) ) {
    $.clearError( $.emailTextField );
    $.clearErrorMessage();
    emailValid = true;
  } else {
    $.setError( $.emailTextField );
    $.setErrorMessageString("Not a valid email address");
    emailValid = false;
  }
  validateSubmit();
}

function nameChanged() {
  if ( $.nameTextField.value.length > 2 ) {
    $.clearError( $.nameTextField );
    nameValid = true;
  } else {
    $.setError( $.nameTextField );
    nameValid = false;
  }
  validateSubmit();
}

function passwordChanged() {
  if ( $.passwordTextField.value.length >= 8) {
    if ( /[0-9]+/.test($.passwordTextField.value) ) {
      if ( /[A-Z]+/.test($.passwordTextField.value) ) {
        if ( /[a-z]+/.test($.passwordTextField.value) ) {
          if ( !/^[a-zA-Z0-9]+$/.test($.passwordTextField.value) ) {
            if ( $.passwordTextField.value == $.passwordConfirmTextField.value ) {
              $.clearError($.passwordTextField);
              $.clearError($.passwordConfirmTextField);
              $.clearErrorMessage();
              passwordValid = true;
              validateSubmit();
              return;
            } else {
              passwordValid = false;
              $.setErrorMessageString("Passwords do not match");
            }
          } else {
            passwordValid = false;
            $.setErrorMessageString("Password must contain a symbol");
          }
        } else {
          passwordValid = false;
          $.setErrorMessageString("Password must contain at least one lower case character");
        }
      } else {
        passwordValid = false;
        $.setErrorMessageString("Password must contain at least one upper case character");
      }
    } else {
      passwordValid = false;
      $.setErrorMessageString("Password must contain a digit");
    }
  } else {
    passwordValid = false;
    $.setErrorMessageString("Password must have at least 8 characters");
  }

  $.setError($.passwordTextField);
  $.setError($.passwordConfirmTextField);
  
  validateSubmit();
}

function passwordConfirmChanged() {
  passwordChanged();
}

function validateSubmit() {
  if ( emailValid && nameValid && passwordValid ) {
    $.enable($.submitButton);
  } else {
    $.disable($.submitButton);
  }
}

function submitClick() {
  Alloy.Globals.CerdiApi.registerUser( {
      email: $.emailTextField.value,
      group: $.groupToggle.value,
      survey_consent: $.surveyToggle.value,
      share_name_consent: $.dataToggle.value,
      name: $.nameTextField.value,
      password: $.passwordTextField.value
  }).then( (response ) => {
    Ti.API.info(`Registered user ${$.emailTextField.value}`);
    Alloy.Globals.CerdiApi.storeUserToken( response );
    Topics.fireTopicEvent( Topics.HOME, null );
  })
  .catch( (err) => {
    Ti.API.error(`Unexpected error: ${JSON.stringify( err)}`);
    $.setError($.passwordTextField);
    $.setError($.passwordConfirmTextField);
    $.setError($.emailTextField);
    $.setError($.nameTextField);
    $.setErrorMessage(err);
  });
}
$.disable($.submitButton);