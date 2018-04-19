#! /usr/bin/node
var fs = require('fs');
var KeyLoader = require("logic/KeyLoaderXml");

function flatten( key ) {
  var csv = 'id,parent_id,scientific_name,common_name,taxonomic_level\n';
  key.findAllTaxons().forEach( function(taxon) {
    csv += taxon.numericId + ',' + (taxon.taxonParent?taxon.taxonParent.numericId:'') +',"' + taxon.name + '","' + taxon.commonName +'","' + taxon.taxonomicLevel + '"\n';
  });
  return csv;
}


var key = KeyLoader.loadKey( './walta/' );
fs.writeFileSync( './walta/key_flatten.csv', flatten(key) );
