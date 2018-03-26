// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var taxon = $.args.taxon;
var speedbugIndex = $.args.speedbugIndex;
var speedBug = speedbugIndex.getSpeedbugFromTaxonId( taxon.get("taxonId") );
$.icon.image = "/".concat(speedBug.imgUrl);
var multiplicity = taxon.get("multiplicity");
if ( multiplicity !== 1 ) {
  $.multiplicity.text = multiplicity;
} else {
  $.SampleTaxaIcon.remove($.multiplicity);
}
