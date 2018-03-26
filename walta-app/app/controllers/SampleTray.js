
var speedbugIndex = $.args.speedbugIndex;

var PlatformSpecific = require('ui/PlatformSpecific');


var lastScroll = null;
var endCapWidth = 151;
var middleWidth = 209;

var tileIndex = [];

function roundToTile( x ) {
  return Math.floor(x / middleWidth);
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
      tileIndex[i] = tile;
      $.SampleTray.add( tile );
    }
  }
}

function updateVisibleTiles( lastScroll, scrollx ) {
  var viewWidth = PlatformSpecific.convertSystemToDip( $.SampleTray.getSize().width );
  if ( lastScroll > scrollx ) {
    releaseTiles(
      roundToTile(scrollx + viewWidth + 2*middleWidth - endCapWidth),
      roundToTile(lastScroll + viewWidth + 2*middleWidth - endCapWidth)
    );
    addTiles(
      roundToTile(scrollx - 2*middleWidth - endCapWidth),
      roundToTile(lastScroll - 2*middleWidth - endCapWidth),
    );
  } else {
    releaseTiles(
      roundToTile(lastScroll - 2*middleWidth - endCapWidth ),
      roundToTile(scrollx - 2*middleWidth - endCapWidth)
    );
    addTiles(
      roundToTile(lastScroll + viewWidth + 2*middleWidth - endCapWidth),
      roundToTile(scrollx + viewWidth + 2*middleWidth - endCapWidth)
    );
  }
}

function drawIcecubeTray() {
  var scrollx = PlatformSpecific.convertSystemToDip( $.SampleTray.getContentOffset().x );

  // Add or remove any tiles according to scroll position
  if ( (lastScroll == null) || Math.abs( scrollx - lastScroll ) > middleWidth ) {
    Ti.API.trace(`scrollx = ${scrollx} lastScroll = ${lastScroll}`);
    if ( lastScroll !== null ) {
      updateVisibleTiles( lastScroll, scrollx );
    } else {
      addTiles( 0, 3 );
    }
    $.trigger("trayupdated");
    lastScroll = scrollx;
  }

};

addFirstTwoSampleTrayIcons();

$.SampleTray.addEventListener( "scroll", drawIcecubeTray );
$.SampleTray.addEventListener( "postlayout", drawIcecubeTray );

function cleanup() {
  $.SampleTray.removeEventListener("scroll", drawIcecubeTray);
  $.SampleTray.removeEventListener("postlayout", drawIcecubeTray);
}

exports.cleanup = cleanup;
