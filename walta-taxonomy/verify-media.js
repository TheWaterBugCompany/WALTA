#! /usr/bin/node
var fs = require('fs');
var colors = require('colors');
var KeyLoader = require("logic/KeyLoaderJson");
var key = KeyLoader.loadKey( './walta/' );
var blankFound = false;
var missingFound = false;
key.findAllMedia(undefined,false).forEach ( (url)=>{
  if ( !url || url.trim().length == 0 ) {
    blankFound = true;
  } else {
    let path = url.replace('/taxonomy/','');
    if( ! fs.existsSync( path ) ) {
      missingFound = true;
      console.log(`${path} missing!`.red)
    }
  }
});
if ( blankFound ) {
    console.log("Blank media found - searching for culprit nodes"); 
    var nodes = _(key.findAllNodes()).filter( (n) => _(n.mediaUrls).any( (url)=> (url.trim().length == 0) || !url ) );
    nodes.forEach( (n) => console.log(`${JSON.stingify(_(n).pick( (p) => typeof p !== "object"))}`.red) );
}
if ( !blankFound && !missingFound ) {
  console.log("No errors founds!".green);
}
