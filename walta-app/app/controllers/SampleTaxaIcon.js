var Topics = require('ui/Topics');
var taxon = $.args.taxon;
var speedbugIndex = $.args.speedbugIndex;

setImage( taxon );
setAbundance( taxon );

var lastTaxonId;
function setImage( taxon ) {
  $.icon.image = taxon.getSilhouette();
  lastTaxonId = taxon.get("taxonId");
}

var lastAbundance;
function setAbundance( taxon ) {
  var abundance = taxon.get("abundance");
  $.abundance.text = abundance;
  if ( abundance !== 1 ) {
    $.abundance.show();
  } else {
    $.abundance.hide();
  }
  lastAbundance = abundance;
}

function update( newTaxon ) {
  if ( lastTaxonId != newTaxon.get("taxonId") ) {
    setImage( newTaxon );
  }
  if ( lastAbundance != newTaxon.get("abundance") ) {
    setAbundance( newTaxon );
  }
}

function clickEvent(e) {
  Topics.fireTopicEvent( Topics.IDENTIFY, { taxonId: taxon.get("taxonId") } );
  e.cancelBubble = true;
}

exports.update = update;
