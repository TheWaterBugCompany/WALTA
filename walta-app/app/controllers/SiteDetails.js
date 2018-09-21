exports.baseController  = "TopLevelWindow";
var Topics = require("ui/Topics");

var sample = Alloy.Models.sample;

function loadAttributes() {
    Ti.API.info(`Survey sampleId = ${sample.get("sampleId")}`);
    var surveyType = sample.get("surveyType"),
        waterbodyType = sample.get("waterbodyType");
    if ( surveyType !== undefined ) {
        $.surveyLevelSelect.setIndex(surveyType);
    }
    if ( waterbodyType !== undefined ) {
        $.waterbodyTypeSelect.setIndex(waterbodyType);
    }
    $.waterbodyNameField.value = sample.get("waterbodyName");
    $.nearByFeatureField.value = sample.get("nearbyFeature");
    checkValidity();
}

function checkValidity() {
    surveyTypeChanged();
    waterbodyTypeChanged();
    waterbodyNameChanged();
    nearbyFeatureChanged();
    validateSubmit();
}

var surveyTypeValid = false;
var waterbodyTypeValid = false;
var waterbodyNameValid = false;
var nearbyFeatureValid = false;

function setTabError( view ) {
    view.borderColor = "red";
    view.borderWidth = "1dp";
}

function clearTabError( view ) {
    view.borderColor = "transparent";
    view.borderWidth = 0;
}

function surveyTypeChanged() {
    if ( typeof( $.surveyLevelSelect.getIndex() ) === "number" ) {
      clearTabError( $.surveyLevelError );
      surveyTypeValid = true;
      sample.set( { "surveyType": `${$.surveyLevelSelect.getIndex()}` } );
      sample.save();
    } else {
      setTabError($.surveyLevelError);
      surveyTypeValid = false;
    }
}

function waterbodyTypeChanged() {
    if ( typeof( $.waterbodyTypeSelect.getIndex() ) === "number" ) {
      clearTabError( $.waterbodyTypeError );
      waterbodyTypeValid = true;
      sample.set( { "waterbodyType": `${$.waterbodyTypeSelect.getIndex()}` } );
      sample.save();
    } else {
      setTabError( $.waterbodyTypeError );
      waterbodyTypeValid = false;
    }
}

function waterbodyNameChanged() {
    if ( $.waterbodyNameField.value && $.waterbodyNameField.value.length > 0 ) {
      $.clearError( $.waterbodyNameField );
      waterbodyNameValid = true;
      sample.set( { "waterbodyName": $.waterbodyNameField.value } );
      sample.save();
    } else {
      $.setError( $.waterbodyNameField );
      waterbodyNameValid = false;
    }
    
}

function nearbyFeatureChanged() {
    nearbyFeatureValid = true;
    sample.set( { "nearbyFeature": $.nearByFeatureField.value } );
    sample.save();
}

function validateSubmit() {
    if ( surveyTypeValid && waterbodyNameValid && waterbodyTypeValid && nearbyFeatureValid) {
        $.enable($.nextButton);
    } else {
        $.disable($.nextButton);
    }
}

function nextClick() {
    Topics.fireTopicEvent( Topics.HABITAT );
}

$.TopLevelWindow.title = "Site Details";
$.surveyLevelSelect.init(["Mayfly","Quick","Detailed"], checkValidity);
$.waterbodyTypeSelect.init(["River","Wetland","Lake/Dam"], checkValidity);
loadAttributes();