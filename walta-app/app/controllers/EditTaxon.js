var taxon = $.args.taxon;
var key = $.args.key;
var speedbugIndex = $.args.key.getSpeedbugIndex();

$.taxonName.text = key.findTaxonById( taxon.get("taxonId") ).name;

setImage( taxon.get("taxonId") );
setMultiplicity( taxon.get("multiplicity") );

function setImage( taxonId ) {
  $.photoSelect.setImage( speedbugIndex.getSpeedbugFromTaxonId( taxonId  ) );
}

function setMultiplicity( binValue  ) {
    taxon.set("multiplicity", binValue) 
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
$.saveButton.on("click", () => {
    taxon.set('multiplicity', $.abundanceLabel.text );
    Alloy.Collections["taxa"].add( taxon );
    taxon.save();
    $.trigger("save", taxon );
});

$.deleteButton.on("click", () => {
    Alloy.Collections["taxa"].remove( taxon );
    taxon.destroy();
    $.trigger("delete", taxon );
});

$.closeButton.on("click", () => $.trigger("close") );
