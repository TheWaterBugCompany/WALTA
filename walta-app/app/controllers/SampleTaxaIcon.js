var Topics = require('ui/Topics');
var key = $.args.key;
var taxon = $.args.taxon;
var readOnlyMode = $.args.readonly === true;
setImage( taxon );
setAbundance( taxon );

// iOS aggregates children into a single accessible element when the
// container has accessibilityLabel set — so child-level labels on the
// icon / abundance are invisible to VoiceOver and to Appium. Build a
// single descriptive label on the container that names the species and
// the abundance alongside the existing taxonId, which keeps the tile
// meaningful to screen-reader users and lets acceptance tests assert
// against species name and abundance without extra hooks.
function updateAccessibilityLabel( taxon ) {
  // The sample's taxon model only carries taxonId / abundance — look up the
  // species name from the key (passed in via $.args.key) so the
  // accessibility label describes the tile meaningfully.
  var taxonId = taxon.get("taxonId");
  var keyTaxon = key && taxonId ? key.findTaxonById(taxonId) : null;
  var name = keyTaxon ? keyTaxon.name : "unknown";
  var label =
    `Taxon ${taxonId}, ` +
    `${name}, ` +
    `abundance ${taxon.get("abundance")}`;
  $.SampleTaxaIcon.accessibilityLabel = label;
}

var lastTaxonId;
function setImage( taxon ) {
  $.icon.image = taxon.getSilhouette();
  updateAccessibilityLabel( taxon );
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
  updateAccessibilityLabel( taxon );
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

function fireEditEvent() {
  Topics.fireTopicEvent( Topics.IDENTIFY, { sampleTaxonId: taxon.get("sampleTaxonId"), readonly: readOnlyMode } );
}

function cleanUp() {
  $.destroy();
  $.off();
}

exports.fireEditEvent = fireEditEvent;
exports.cleanUp = cleanUp;
exports.update = update;
