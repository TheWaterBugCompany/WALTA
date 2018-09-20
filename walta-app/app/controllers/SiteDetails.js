exports.baseController  = "TopLevelWindow";
var Topics = require("ui/Topics");

var sample = Alloy.Models.sample;

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
}

function saveAttributes() {
    Ti.API.info(`surveyType = ${$.surveyLevelSelect.getIndex()}, waterbodyType = ${$.waterbodyTypeSelect.getIndex()}`);
    sample.set( {
        "surveyType": `${$.surveyLevelSelect.getIndex()}`,
        "waterbodyType": `${$.waterbodyTypeSelect.getIndex()}`,
        "waterbodyName": $.waterbodyNameField.value,
        "nearbyFeature": $.nearByFeatureField.value
    });
    sample.save();
    Ti.API.info(`surveyType = ${sample.get("surveyType")}, waterbodyType = ${sample.get("waterbodyType")} `)
			
}

function nextClick() {
    Topics.fireTopicEvent( Topics.HABITAT );
}

$.TopLevelWindow.title = "Site Details";
$.surveyLevelSelect.init(["Mayfly","Quick","Detailed"], saveAttributes);
$.waterbodyTypeSelect.init(["River","Wetland","Lake/Dam"], saveAttributes);
loadAttributes();