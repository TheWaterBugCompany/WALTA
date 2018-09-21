var Topics = require('ui/Topics');

var emailValidity = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var emailValid = false;
var nameValid = false;
var passwordValid = false;

$.TopLevelWindow.title = "Register";
exports.baseController = "TopLevelWindow";


function emailChanged() {
  if ( emailValidity.test($.emailTextField.value) ) {
    $.clearError( $.emailTextField );
    emailValid = true;
  } else {
    $.setError( $.emailTextField );
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
  if ( $.passwordTextField.value == $.passwordConfirmTextField.value 
       && $.passwordTextField.value.length > 5 ) {
        $.clearError($.passwordTextField);
        $.clearError($.passwordConfirmTextField);
        passwordValid = true;
       }
  else {
    $.setError($.passwordTextField);
    $.setError($.passwordConfirmTextField);
    passwordValid = false;
  }
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
  });
}

emailChanged();
nameChanged();
passwordChanged();
