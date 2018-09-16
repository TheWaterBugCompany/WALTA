var Topics = require('ui/Topics');
var taxon = $.args.taxon;
var speedbugIndex = $.args.speedbugIndex;
setImage( taxon.get("taxonId") );
setAbundance( taxon.get("abundance") );

var lastTaxonId;
function setImage( taxonId ) {
  var speedBug = speedbugIndex.getSpeedbugFromTaxonId( taxonId  );
  $.icon.image = speedBug;
  lastTaxonId = taxonId;
}

var lastAbundance;
function setAbundance( abundance ) {
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
    setImage( newTaxon.get("taxonId") );
  }
  if ( lastAbundance != newTaxon.get("abundance") ) {
    setAbundance( newTaxon.get("abundance") );
  }
}
$.getView().on("click",
  function(e) {
    Topics.fireTopicEvent( Topics.IDENTIFY, { taxonId: taxon.get("taxonId") } );
    e.cancelBubble = true;
  } );

exports.update = update;
