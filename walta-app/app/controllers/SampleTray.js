
var speedbugIndex = $.args.speedbugIndex;

var PlatformSpecific = require('ui/PlatformSpecific');


var lastScroll = null;
var endCapWidth = 151;
var middleWidth = 209;

var tileIndex = [];

function roundToTile( x ) {
  return Math.floor((x + endCapWidth) / middleWidth);
}

function mapTileNumToCollection( n ) {
  return n*4+2;
}

function addFirstTwoSampleTrayIcons() {
  var sampleContainer = Ti.UI.createView({
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    left: '30dp',
    layout: 'vertical'
  });
  [ 0, 1 ].forEach( function(j) {
    var taxon = Alloy.Collections["taxa"].at(j);
    sampleContainer.add( createSampleTrayIcon( taxon, j) );
  });
  $.endcap.add(sampleContainer);
}

function createSampleTrayIcon(taxon, i) {
  var thumbnail = Ti.UI.createView( {
    left: '20dp',
    top: '50dp',
    width: '80dp',
    height: '90dp'
  });
  if ( typeof( taxon ) !== "undefined" ) {
    var speedbugIcon = Alloy.createController( "SampleTaxaIcon", {
        taxon: taxon,
        speedbugIndex: speedbugIndex
      } );
    thumbnail.add(speedbugIcon.getView());
  }
  return thumbnail;
}

function fillSampleTrayTile( sampleNum ) {
  var sampleContainer = Ti.UI.createView({
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    layout: 'horizontal'
  });

  [ 0, 2, 1, 3 ].forEach( function(j) {
    var taxon = Alloy.Collections["taxa"].at(sampleNum + j);
    sampleContainer.add( createSampleTrayIcon( taxon, sampleNum + j ) );
  });
  return sampleContainer;
}

function createSampleTrayTile( tileNum ) {
  var tile = Ti.UI.createView({
    width: `${middleWidth}dp`,
    left: `${tileNum*middleWidth+endCapWidth}dp`
  });
  var trayBackground =  Ti.UI.createImageView({
        image: 'images/tiling_interior_320.png',
        height: Ti.UI.FILL
  });
  tile.add( trayBackground );
  tile.add( fillSampleTrayTile( mapTileNumToCollection(tileNum) ) );
  return tile;
}

function releaseTiles( start_n, end_n ) {
  Ti.API.trace("SampleTray release tiles start_n = " + start_n + " end_n = " + end_n );
  for( var i = start_n; i<=end_n; i++ ) {
    if ( i >=  0 ) {
      var tile = tileIndex[i];
      if ( typeof( tile ) !== "undefined" ) {
        $.SampleTray.remove( tile );
        delete tileIndex[i];
      }
    }
  }
}

function addTiles( start_n, end_n ) {
  Ti.API.trace("SampleTray load tiles start_n = " + start_n + " end_n = " + end_n );
  for( var i = start_n; i<=end_n; i++ ) {
    if ( i >=  0 && ( i <= ((Alloy.Collections["taxa"].length + 2)/4) ) ) {
      var tile = createSampleTrayTile( i );
      if ( typeof( tileIndex[i] ) === "undefined" ) {
        tileIndex[i] = tile;
        $.SampleTray.add( tile );
      }
    }
  }
}

function updateVisibleTiles( scrollx) {
  var viewWidth = PlatformSpecific.convertSystemToDip( $.SampleTray.getSize().width );
  var rightEdge = roundToTile( scrollx + viewWidth + middleWidth );
  var leftEdge = roundToTile( scrollx - middleWidth - endCapWidth );
  addTiles(leftEdge,rightEdge);
  releaseTiles( 0, leftEdge - 1 );
  releaseTiles( rightEdge + 1, tileIndex.length );
}

function drawIcecubeTray() {
  var scrollx = PlatformSpecific.convertSystemToDip( $.SampleTray.getContentOffset().x );
  updateVisibleTiles( scrollx );
  $.trigger("trayupdated");
};

addFirstTwoSampleTrayIcons();

$.SampleTray.addEventListener( "scroll", drawIcecubeTray );
$.SampleTray.addEventListener( "postlayout", function firstRender() {
    $.SampleTray.removeEventListener("postlayout", firstRender );
    drawIcecubeTray();
  });

function cleanup() {
  $.SampleTray.removeEventListener("scroll", drawIcecubeTray);
}

exports.cleanup = cleanup;
