exports.baseController  = "TopLevelWindow";
var Topics = require("ui/Topics");
var GeoLocationService = require('logic/GeoLocationService');

var sample = Alloy.Models.sample;

sample.on("change:lng change:lat", updateLocation );
sample.on("change:dateCompleted", loadAttributes );

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
    sample.off( null, updateLocation );
    sample.off( null, loadAttributes );
    $.TopLevelWindow.removeEventListener('close', cleanUp );
    $.TopLevelWindow.removeEventListener( 'swipe', swipeListener );
    GeoLocationService.stop();
});

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, { swipe: true, name: $.name, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } );
	}
}
$.TopLevelWindow.addEventListener('swipe', swipeListener);

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.waterbodyNameField, $.nearByFeatureField ] );


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

    if  ( sample.isReadOnly() )  {
        $.surveyLevelSelect.disable();
        $.waterbodyTypeSelect.disable();
        $.waterbodyNameField.setEditable(false);
        $.nearByFeatureField.setEditable(false);
        $.photoSelect.disable();
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
        $.enableControl($.nextButton);
    } else {
        $.disableControl($.nextButton);
    }
}

function nextClick() {
    Topics.fireTopicEvent( Topics.HABITAT );
}

function openLocationEntry() {
    $.locationEntry = Alloy.createController("LocationEntry");
    if ( sample.isReadOnly() )
        $.locationEntry.disable();

    $.TopLevelWindow.add($.locationEntry.getView());
}

$.photoSelect.on("photoTaken", function(blob) {
    sample.setSitePhoto(blob);
});

$.TopLevelWindow.title = "Site Details";
$.surveyLevelSelect.init(["Mayfly","Quick","Detailed"], checkValidity);
$.waterbodyTypeSelect.init(["River","Wetland","Lake/Dam"], checkValidity);
loadAttributes();

// Start location services only for this screen
GeoLocationService.start();

// Only allow automatic location updates if the location was
// undefined when this screen was opened
if ( ! ( sample.get('lat') || sample.get('lng') ) ) {
    Topics.subscribe(Topics.GPSLOCK, function(coords) {
        // only set location if the accuracy is present and less than 100m
        if ( coords.accuracy < 100 ) {
            var accuracy = sample.get("accuracy");
            Alloy.Models.sample.setLocation(coords);
        }
    } );
}


