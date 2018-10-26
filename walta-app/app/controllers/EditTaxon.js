var taxon = $.args.taxon;
var key = $.args.key;
var speedbugIndex = $.args.key.getSpeedbugIndex();

$.taxonName.text = key.findTaxonById( taxon.get("taxonId") ).commonName;

setImage( taxon.getPhoto() );
setAbundance( taxon.get("abundance") );

function setImage( photo ) {
    if ( photo ) {
        $.photoSelect.setImage( photo );
    } else {
        $.photoSelect.setImage( speedbugIndex.getSpeedbugFromTaxonId( taxon.get("taxonId")  ) );
    }
}

function setAbundance( binValue  ) {
    taxon.set("abundance", binValue) 
    var nums = binValue.split("-");
    $.abundanceValue.value = ( parseInt(nums[1]) + parseInt(nums[0]) ) / 2;
}

function updateAbundance() {
    var val = $.abundanceValue.value
    var binValue;
    if ( val >= 1 && val <= 3 ) {
        binValue = "1-2";
    } else if ( val > 3 && val <= 6 ) {
        binValue = "3-5";
    } else if ( val > 6 && val <= 11 ) {
        binValue = "6-10";
    } else if ( val > 11 && val <= 20 ) {
        binValue = "11-20";
    } else {
        binValue = "> 20";
    }
    $.abundanceLabel.text = binValue; 
}

function saveEvent() {
    taxon.set("abundance", $.abundanceLabel.text );
    Alloy.Collections["taxa"].add( taxon );
    taxon.save();
    if ( cachedPhoto ) {
        taxon.setPhoto(cachedPhoto);
    }
    $.trigger("save", taxon );
}

function deleteEvent() {
    Alloy.Collections["taxa"].remove( taxon );
    taxon.destroy();
    $.trigger("delete", taxon );
}

function closeEvent() {
    $.trigger("close") 
}
var cachedPhoto;
$.photoSelect.on("photoTaken", function(photo) {
    cachedPhoto = photo;
});