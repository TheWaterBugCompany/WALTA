#! /usr/bin/node
var fs = require('fs');
var CircularJSON = require('circular-json');
var KeyLoader = require("logic/KeyLoaderXml");
var Taxon = require("logic/Taxon");

var key = KeyLoader.loadKey( '../walta-app/app/assets/taxonomy/walta/', '/taxonomy/walta' );

var questions = "";
var taxa = "";

var lastUnnumberedNode = 1;
var hasNodeBeenDone = {};

function getInkyId( node ) {
  if ( node.parentLink == null ) {
    return "root";
  } else if ( node.id != "" ) {
    return node.id.replace('-','_');
  } else {
    node.id = ( key.isTaxon(node) ? "taxon_" : "node_" ) + lastUnnumberedNode++;
    return node.id;
  }
}

function toInk( node ) {
  if ( !hasNodeBeenDone[getInkyId(node)] ) {
    hasNodeBeenDone[getInkyId(node)] = true;
    var inky =  `\n=== ${getInkyId(node)} ===\n`;
    if ( key.isNode(node) ) {
      node.questions.forEach(
        (q) => inky += `* ${q.text} -> ${getInkyId(q.outcome)} # mediaUrls: ${JSON.stringify(q.mediaUrls)}\n`);

      questions += inky;
      node.questions.forEach( (q) => toInk( q.outcome ) );
    } else {
      inky +=
`# taxonId: ${JSON.stringify(node.taxonId)}
# name: ${JSON.stringify(node.name)}
# scientificName: ${JSON.stringify(node.scientificName)}
# commonName: ${JSON.stringify(node.commonName)}
# size: ${JSON.stringify(node.size)}
# signalScore: ${JSON.stringify(node.signalScore)}
# habitat: ${JSON.stringify(node.habitat)}
# movement: ${JSON.stringify(node.movement)}
# confusedWith: ${JSON.stringify(node.confusedWith)}
# taxonomicLevel: ${JSON.stringify(node.taxonomicLevel)}
# mediaUrls: ${JSON.stringify(node.mediaUrls)}
# description: ${JSON.stringify(node.description)}
-> DONE\n`
        taxa += inky;
      }
    }

  }

toInk( key.getRootNode() );

var inkScript = "/* Start at the key identification */\n-> root \n";
inkScript += "\n/* Question Nodes */\n";
inkScript += questions;
inkScript += "\n/* Taxa Nodes */\n";
inkScript += taxa;

fs.writeFileSync( 'walta/key.ink', inkScript );
