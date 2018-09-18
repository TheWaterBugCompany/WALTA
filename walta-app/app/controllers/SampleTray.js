var key = $.args.key;
var speedbugIndex = $.args.key.getSpeedbugIndex();

var PlatformSpecific = require('ui/PlatformSpecific');
var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
var anchorBar = $.getAnchorBar();
anchorBar.addTool( anchorBar.createToolBarButton( null, Topics.COMPLETE, "Submit") );

var endcapHeight = 0;
var endcapWidth = 0;
var middleWidth = 0;

// Keeps track of the tile views we cache
var tileIndex = [];
var firstTwoTiles = null;

function clearTileCache() {
  for( var i = 0; i<=tileIndex.length; i++ ) {
    var tile = tileIndex[i];
    if ( typeof( tile ) !== "undefined" ) {
      $.content.remove( tile.container );
      delete tileIndex[i];
    }
  }
  tileIndex = [];
  if ( firstTwoTiles ) {
    $.endcap.remove(firstTwoTiles.container);
    firstTwoTiles = null;
  }
}

function roundToTile( x ) {
  return Math.floor((x + endcapWidth) / middleWidth);
}

function mapTileNumToCollection( n ) {
  return n*4+2;
}

/* addTrayIcon and updateTrayIcon return a controller if and only if
   one was created */
function addTrayIcon( container, index ) {
  var thumbnail = createIconContainer();
  container.add( thumbnail );
  if ( index < Alloy.Collections["taxa"].length) {
    var taxon = Alloy.Collections["taxa"].at(index);
    if ( typeof( taxon ) !== "undefined" ) {
      var icon = createTaxaIcon( taxon );
      thumbnail.add( icon.getView() );
      return {
        view: thumbnail,
        controller: icon
      };
    }
  } else if ( index === Alloy.Collections["taxa"].length ) {
    thumbnail.add( createAddIcon() );
  }
  return {
    view: thumbnail
  }
}

function updateTrayIcon( icon, index ) {
  if ( index < Alloy.Collections["taxa"].length) {
    var taxon = Alloy.Collections["taxa"].at(index);
    if ( typeof( taxon ) !== "undefined" ) {
      if ( typeof( icon.controller ) !== "undefined" ) {
        icon.controller.update(taxon);
      } else {
        var controller = createTaxaIcon( taxon );
        icon.controller = controller;
        icon.view.removeAllChildren();
        icon.view.add( controller.getView() );
      }
    }
  } else if ( index === Alloy.Collections["taxa"].length ) {
    if ( ! icon.plusIcon ) {
      icon.view.removeAllChildren();
      icon.view.add(createAddIcon());
      icon.plusIcon = true;
      if ( icon.controller )
        delete icon.controller;
    }
  } else {
    icon.view.removeAllChildren();
    delete icon.controller;
  }
}

function updateFirstTwoSampleTrayIcons() {
  if ( !firstTwoTiles ) {
    // Create new tiles
    firstTwoTiles = {
      container: Ti.UI.createView({
              width: Ti.UI.FILL,
              height: Ti.UI.FILL,
              left: `${endcapWidth*0.3}dp`,
              layout: 'vertical'
            }),
      icons: []
    };
    [ 0, 1 ].forEach( function(j) {
        firstTwoTiles.icons[j] = addTrayIcon( firstTwoTiles.container, j );
    });
    $.endcap.add(firstTwoTiles.container);
  } else {
    // Update existing
    [ 0, 1 ].forEach( function(j) {
      updateTrayIcon( firstTwoTiles.icons[j], j);
    });
  }
}

function createIconContainer() {
  return Ti.UI.createView( {
    top: `${endcapHeight*0.1}dp`,
    left: `${endcapWidth*0.1}dp`,
    width: `${endcapWidth*0.5}dp`,
    height: `${endcapHeight*0.35}dp`,
  });
}
var addIconCache = null;
function createAddIcon() {
  if ( !addIconCache ) {
    addIconCache = Ti.UI.createButton({
      top: `${endcapHeight*0.10}dp`,
      left: `${endcapWidth*0.15}dp`,
      width: `${endcapWidth*0.25}dp`,
      height: `${endcapHeight*0.13}dp`,
      accessibilityLabel: "Add",
      backgroundImage: "/images/plus-icon.png"
    });
    addIconCache.addEventListener( "click", startIdentification );
  }
  return addIconCache;
}

function createTaxaIcon(taxon) {
  var speedbugIcon = Alloy.createController( "SampleTaxaIcon", {
      taxon: taxon,
      speedbugIndex: speedbugIndex
    } );

  return speedbugIcon;
}

/*
  In order to not cause eye watering flicker we have two functions for
  drawing tiles. The first creates fresh tile. The second examines exist
  tiles and only updates icons that have changed.
*/
function createSampleTrayTile( tileNum ) {
  var tile = Ti.UI.createView({
    height: `${endcapHeight}dp`,
    width: `${middleWidth}dp`,
    left: `${tileNum*middleWidth+endcapWidth}dp`
  });
  var trayBackground =  Ti.UI.createImageView({
        image: '/images/tiling_interior_320.png',
        height: `${endcapHeight}dp`,
        width: `${middleWidth}dp`
  });
  tile.add( trayBackground );
  
  var icons = fillSampleTrayIcons( mapTileNumToCollection(tileNum) );
  tile.add( icons.container );
  return { container: tile, icons: icons.icons };
}

function fillSampleTrayIcons( sampleNum ) {
  var icons = {
    container: Ti.UI.createView({
      width: Ti.UI.FILL,
      height: Ti.UI.FILL,
      layout: 'horizontal'
    }),
    icons: []
  };

  [ 0, 2, 1, 3 ].forEach( function(j) {
    icons.icons.push( addTrayIcon( icons.container, sampleNum + j ) );
  });
  return icons;
}

function updateSampleTrayTile( tileNum ) {
  var tile = tileIndex[tileNum];
  [ 0, 2, 1, 3 ].forEach( function(j,i) {
    updateTrayIcon( tile.icons[i], mapTileNumToCollection(tileNum) + j );
  });
}

function releaseTiles( start_n, end_n ) {
  for( var i = start_n; i<=end_n; i++ ) {
    if ( i >=  0 ) {
      var tile = tileIndex[i];
      if ( typeof( tile ) !== "undefined" ) {
        $.content.remove( tile.container );
        delete tileIndex[i];
      }
    }
  }
}

function addTiles( start_n, end_n ) {
  for( var i = start_n; i<=end_n; i++ ) {
    // max() below is to add an extra blank tile with an empty tray...
    if ( i >=  0 && ( i <= Math.max((Alloy.Collections["taxa"].length + 2)/4,2) ) ) {
      var tile;
      if ( typeof( tileIndex[i] ) !== "undefined") {
        updateSampleTrayTile( i );
      } else {
        tile = createSampleTrayTile( i );
        tileIndex[i] = tile;
        $.content.add( tile.container );
      }

    }
  }
}

function updateVisibleTiles( scrollx) {
  var viewWidth = PlatformSpecific.convertSystemToDip( $.content.getSize().width );
  var rightEdge = roundToTile( scrollx + viewWidth + middleWidth );
  var leftEdge = roundToTile( scrollx - middleWidth - endcapWidth );
  addTiles(leftEdge,rightEdge);
  releaseTiles( 0, leftEdge - 1 );
  releaseTiles( rightEdge + 1, tileIndex.length );
}

function drawIcecubeTray() {
  var scrollx = PlatformSpecific.convertSystemToDip( $.content.getContentOffset().x );
  updateFirstTwoSampleTrayIcons();
  updateVisibleTiles( scrollx );
  $.trigger("trayupdated");
};

function startIdentification(e) {
  $.selectMethod = Alloy.createController("MethodSelect");
  function closeSelectMethod() {
    $.TopLevelWindow.remove($.selectMethod.getView());
  }

  $.selectMethod.on("close", function() {
    closeSelectMethod();
  });

  $.selectMethod.on("keysearch", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.KEYSEARCH );
  });

  $.selectMethod.on("speedbug", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.SPEEDBUG );
  });

  $.selectMethod.on("browselist", function() {
    closeSelectMethod();
    Topics.fireTopicEvent( Topics.BROWSE );
  });

  $.TopLevelWindow.add($.selectMethod.getView());

  e.cancelBubble = true;
};

function adjustTraySize() {
  if ( $.content.height !== endcapHeight ) {
    endcapHeight = $.TopLevelWindow.size.height - $.getAnchorBar().getView().size.height;
    endcapWidth = $.endcapBackground.size.width;
    middleWidth = endcapWidth*1.384;
    clearTileCache();
    drawIcecubeTray();
  }
}

$.content.addEventListener( "click", startIdentification );
$.content.addEventListener( "scroll", drawIcecubeTray );
$.content.addEventListener( "postlayout", adjustTraySize );

Alloy.Collections["taxa"].on("add change remove", drawIcecubeTray );

$.getView().addEventListener( "close", function cleanup() {
  $.content.removeEventListener("postlayout", adjustTraySize );
  $.content.removeEventListener("scroll", drawIcecubeTray);
  Alloy.Collections["taxa"].off("add change remove", drawIcecubeTray );
  $.getView().removeEventListener("close", cleanup);
});

function closeEditScreen() {
  $.getView().remove( $.editTaxon.getView() );
}

function editTaxon( taxon_id ) {
  var taxon = Alloy.Collections["taxa"].get( taxon_id );
  if ( !taxon ) {
    taxon = Alloy.createModel( 'taxa', {taxonId: taxon_id, abundance: "1-2"} );
  }
  $.editTaxon = Alloy.createController("EditTaxon", { taxon: taxon, key: key } );
  $.getView().add( $.editTaxon.getView() );
  
  $.editTaxon.on("close", function() {
    closeEditScreen();
  });

  $.editTaxon.on("delete", function(taxon) {
    taxon.destroy();
    closeEditScreen();
  });

  $.editTaxon.on("save", function(taxon) {
    taxon.save();
    closeEditScreen();
  });
}

if ( $.args.taxonId ) {
  $.getView().on("open", () => editTaxon( $.args.taxonId ) );
}
exports.editTaxon = editTaxon;
