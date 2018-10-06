exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Habitat";

var Topics = require("ui/Topics");
var sample = Alloy.Models.sample;

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

function fixScrollContentsSize(){
    if ( $.content.contentWidth != $.TopLevelWindow.size.width
        || $.content.contentHeight != $.TopLevelWindow.size.height ) {
        $.content.contentWidth = $.content.size.width;
        $.content.contentHeight = $.content.size.height;
    }
}

$.TopLevelWindow.addEventListener("postlayout",fixScrollContentsSize);

function hideKeyboard() {
    if(OS_ANDROID){
        Ti.UI.Android.hideSoftKeyboard();
   } else {
       [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ]
            .forEach( (v)=> v.blur() );
   }
}

$.TopLevelWindow.addEventListener("touchstart",hideKeyboard);

$.TopLevelWindow.addEventListener("close", function closeEvent() {
    $.TopLevelWindow.removeEventListener("touchstart", fixScrollContentsSize );
    $.TopLevelWindow.removeEventListener("touchstart", hideKeyboard );
    $.TopLevelWindow.removeEventListener("close", closeEvent );
});

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
        [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ]
            .forEach( (f) => $.setError(f) );
        $.disable($.nextButton);
    } else {
        [ $.leaves, $.plants, $.wood, $.edgeplants, $.rocks, $.gravel, $.sandOrSilt, $.openwater ]
            .forEach( (f) => $.clearError(f) );
        $.enable($.nextButton);
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

