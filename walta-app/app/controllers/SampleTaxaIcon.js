// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var taxon = $.args.taxon;
var speedbugIndex = $.args.speedbugIndex;
var speedBug = speedbugIndex.getSpeedbugFromTaxonId( taxon.get("taxonId") );
$.icon.image = "/".concat(speedBug.imgUrl);
