exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Habitat";
$.name = "habitat";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;
var readOnlyMode = $.args.readonly === true;

if ( readOnlyMode ) {
    $.leaves.editable = false;
    $.plants.editable = false;
    $.wood.editable = false;
    $.edgeplants.editable = false;
    $.rocks.editable = false;
    $.gravel.editable = false;
    $.sandOrSilt.editable = false;
    $.openwater.editable = false;
}

var { applyKeyboardTweaks } = require("ui/Layout");
applyKeyboardTweaks( $, [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ] );

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar();
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.SITEDETAILS, slide: "left" }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.SAMPLETRAY, slide: "right" } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

function loadAttributes() {
    $.leaves.value = sample.get("leafPacks");
    $.plants.value = sample.get("aquaticPlants");
    $.wood.value = sample.get("wood");
    $.edgeplants.value = sample.get("edgePlants");
    $.rocks.value = sample.get("boulder");
    $.gravel.value = sample.get("gravel");
    $.sandOrSilt.value = sample.get("sandOrSilt");
    $.openwater.value = sample.get("openWater");
}

function validateSum() {
    if ( readOnlyMode ) {
        $.nextButton.enable();
        return;
    }
    var sum = [ $.leaves, $.plants, $.wood, $.sandOrSilt,
        $.edgeplants, $.rocks, $.gravel, $.openwater ]
            .reduce( (a,v) => {
                var i = parseInt( v.value );
                if ( !isNaN(i) )
                    return a + parseInt( v.value );
                else
                    return a;
            }, 0);
   if ( sum !== 100 ) {
        [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ]
            .forEach( (f) => $.setError(f) );
       $.nextButton.disable();
    } else {
        [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ]
            .forEach( (f) => $.clearError(f) );
        $.nextButton.enable();
        saveAttributes();
    }
}

function saveAttributes() {
    function zeroOrInt(v ) {
        var i = parseInt(v);
        if ( isNaN(i) )
            return 0;
        else
            return i;
    }
    sample.set( {
        "leafPacks": zeroOrInt($.leaves.value),
        "aquaticPlants": zeroOrInt($.plants.value),
        "wood": zeroOrInt($.wood.value),
        "edgePlants": zeroOrInt($.edgeplants.value),
        "boulder": zeroOrInt($.rocks.value),
        "gravel": zeroOrInt($.gravel.value),
        "sandOrSilt": zeroOrInt($.sandOrSilt.value),
        "openWater": zeroOrInt($.openwater.value)
    });
    sample.save();
}
loadAttributes();
validateSum();

