// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var taxon = $.args.taxon;
var speedbugIndex = $.args.speedbugIndex;
setImage( taxon.get("taxonId") );
setMultiplicity( taxon.get("multiplicity") );

var lastTaxonId;
function setImage( taxonId ) {
  var speedBug = speedbugIndex.getSpeedbugFromTaxonId( taxonId  );
  $.icon.image = speedBug;
  lastTaxonId = taxonId;
}

var lastMultiplicity;
function setMultiplicity( multiplicity ) {
  $.multiplicity.text = multiplicity;
  if ( multiplicity !== 1 ) {
    $.multiplicity.show();
  } else {
    $.multiplicity.hide();
  }
  lastMultiplicity = multiplicity;
}

function update( newTaxon ) {
  if ( lastTaxonId != newTaxon.get("taxonId") ) {
    setImage( newTaxon.get("taxonId") );
  }
  if ( lastMultiplicity != newTaxon.get("multiplicity") ) {
    setMultiplicity( newTaxon.get("multiplicity") );
  }
}

exports.update = update;
