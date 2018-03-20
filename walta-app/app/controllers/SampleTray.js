var PlatformSpecific = require('ui/PlatformSpecific');

var lastScroll = null;
var endCapWidth = 151;
var middleWidth = 209;

var tileIndex = [];

function roundToTile( x ) {
  return Math.floor(x / middleWidth);
}

function drawIcecubeTray() {

  var scrollx = PlatformSpecific.convertSystemToDip( $.SampleTray.getContentOffset().x );

  // Add or remove any tiles according to scroll position
  if ( (lastScroll == null) || Math.abs( scrollx - lastScroll ) > middleWidth ) {
    var start_n, end_n;
    var viewWidth = PlatformSpecific.convertSystemToDip( $.SampleTray.getSize().width );

    // Release any tiles that are now off the screen
    if ( lastScroll < scrollx ) {
      start_n = roundToTile(lastScroll);
      end_n = roundToTile(scrollx - middleWidth);
    } else {
      start_n = roundToTile(scrollx + viewWidth + middleWidth );
      end_n = roundToTile(lastScroll + middleWidth );
    }
    //Ti.API.log("SampleTray release tiles start_n = " + start_n + " end_n = " + end_n );
    for( var i = start_n; i<=end_n; i++ ) {
      var tile = tileIndex[i];
      if ( tile != null ) {
        $.SampleTray.remove( tile );
        delete tileIndex[i];
      }
    }

    // Calculate the range of tiles that need to be shown
    start_n = roundToTile( scrollx );
    end_n = roundToTile( scrollx + viewWidth + 2*middleWidth );

    //Ti.API.log("SampleTray load tiles start_n = " + start_n + " end_n = " + end_n );
    for( var i = start_n; i<=end_n; i++ ) {
      var tile = Ti.UI.createImageView({
            image: '/images/tiling_interior_320.png',
            height: Ti.UI.FILL
      });
      tileIndex[i] = tile;
      $.SampleTray.add( tile );
    }

    lastScroll = scrollx;
  }

};
$.SampleTray.addEventListener( 'scroll', drawIcecubeTray );
$.SampleTray.addEventListener( 'postlayout', drawIcecubeTray );
