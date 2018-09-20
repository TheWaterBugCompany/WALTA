exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Habitat";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;

function disable() {
    $.nextButton.enabled = false;
    $.nextButton.touchEnabled = false;
    $.nextButton.backgroundColor = "#8a9da1";
  }
  
function enable() {
    $.nextButton.enabled = true;
    $.nextButton.touchEnabled = true;
    $.nextButton.backgroundColor = "#b4d2d9";
}

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
        disable();
    } else {
        enable();
        saveAttributes();
    }
}



function saveAttributes() {
    function zeroOrInt(v ) {
        var i = parseInt(v);
        if ( isNaN(i) )
            return "0";
        else
            return i.toString();
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

function nextClick() {
    Topics.fireTopicEvent( Topics.SAMPLETRAY );
}

loadAttributes();
validateSum();

