var Logger = require('util/Logger');
var log = Logger.log;
var Sample = require("logic/Sample");
exports.baseController  = "TopLevelWindow";
var Topics = require("ui/Topics");
var GeoLocationService = require('logic/GeoLocationService');

var sample = Alloy.Models.sample;
var readOnlyMode = $.args.readonly === true;

sample.on("change:lng change:lat", updateLocation );
sample.on("change:dateCompleted", loadAttributes );

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    $.photoSelect.cleanUp();
    $.destroy();
    $.off();
    sample.off( null, updateLocation );
    sample.off( null, loadAttributes );
    GeoLocationService.stop();
});

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.waterbodyNameField, $.nearByFeatureField ] );

var acb = $.getAnchorBar();  
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HOME, slide: "left", readonly: readOnlyMode }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.HABITAT, slide: "right", readonly: readOnlyMode  } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

function updateLocation() {
    var lat = sample.get("lat");
    var lng = sample.get("lng");
    if ( lat && lng ) {
        $.locationStatus.text = -parseFloat(lat).toFixed(4) + "\u00B0S " + parseFloat(lng).toFixed(4) + "\u00B0E";
        $.locationStatus.color = "#5ea90d";
    }
    else {
        $.locationStatus.text = "Location unobtained";
        $.locationStatus.color = "#ffc000";
    }
    sample.save();
}

function loadAttributes() {
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
    $.photoSelect.setImage( sample.getSitePhoto() );
    updateLocation();
    checkValidity();

    if  ( readOnlyMode )  {
        $.surveyLevelSelect.disable();
        $.waterbodyTypeSelect.disable();
        $.waterbodyNameField.editable = false;
        $.nearByFeatureField.editable = false;
        $.photoSelect.setReadOnlyMode(true);
    } 
}

function checkValidity() {
    surveyTypeChanged();
    waterbodyTypeChanged();
    waterbodyNameChanged();
    nearbyFeatureChanged();
    validateSubmit();
    $.trigger("updated");
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
    let surveyType = $.surveyLevelSelect.getIndex();
    if ( typeof( surveyType ) === "number" ) {
      clearTabError( $.surveyLevelError );
      surveyTypeValid = true;
      
      sample.set( { "surveyType": surveyType } );
      sample.save();
      $.surveyLevelSelect.segCtrlButtonContainer.accessibilityLabel=Sample.surveyTypeToString(surveyType);
    } else {
      setTabError($.surveyLevelError);
      surveyTypeValid = false;
    }
    
}

function waterbodyTypeChanged() {
    let waterbodyType = $.waterbodyTypeSelect.getIndex();
    if ( typeof( waterbodyType ) === "number" ) {
      clearTabError( $.waterbodyTypeError );
      waterbodyTypeValid = true;
      sample.set( { "waterbodyType": waterbodyType } );
      sample.save();
      $.waterbodyTypeSelect.segCtrlButtonContainer.accessibilityLabel=Sample.waterbodyTypeToString(waterbodyType);
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
        $.nextButton.enable();
    } else {
        $.nextButton.disable();
    }
}

function openLocationEntry() {
    $.locationEntry = Alloy.createController("LocationEntry", {readonly: readOnlyMode});
    $.TopLevelWindow.add($.locationEntry.getView());
    $.locationEntry.on("close", function handler() {
        $.locationEntry.off("close", handler);
        $.TopLevelWindow.remove($.locationEntry.getView());
        $.locationEntry.cleanUp();
        $.locationEntry = null;
    })
}

$.photoSelect.on("photoTaken", function(path) {
    log(`photo taken updating site with ${path}`)
    sample.setSitePhoto(path);
    $.photoSelect.setImage( sample.getSitePhoto() ); // update image to new path
    sample.save();
});

$.TopLevelWindow.title = "Site Details";
$.surveyLevelSelect.init(["Mayfly","Quick","Detailed"], checkValidity);
$.waterbodyTypeSelect.init(["River","Wetland","Lake/Dam"], checkValidity);
$.surveyLevelSelect.segCtrlWrapper.accessibilityLabel="Survey Level";
$.waterbodyTypeSelect.segCtrlWrapper.accessibilityLabel="Waterbody Type";

loadAttributes();

// Start location services only for this screen
GeoLocationService.start();

// Only allow automatic location updates if the location was
// undefined when this screen was opened
Topics.subscribe(Topics.GPSLOCK, function(coords) {
    // only set location if the accuracy is present and less than 100m
    log(`got lock`);
    if ( ! ( sample.get('lat') || sample.get('lng') ) ) {
        if ( coords.accuracy < 100 ) {
            var accuracy = sample.get("accuracy");
            if ( !accuracy || accuracy > coords.accuracy ) {
                log(`set location`);
                Alloy.Models.sample.setLocation(coords);
            }
        }
    }
} );


