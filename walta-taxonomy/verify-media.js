#! /usr/bin/node
var fs = require('fs');
var colors = require('colors');
var KeyLoader = require("logic/KeyLoaderJson");
var key = KeyLoader.loadKey( './walta/' );
key.findAllMedia(undefined,false).forEach ( (url)=>{
  let path = url.replace('/taxonomy/','');
  if( ! fs.existsSync( path ) )
    console.log(`${path} missing!`.red)
});
