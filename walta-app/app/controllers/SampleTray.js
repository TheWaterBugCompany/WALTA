var key = $.args.key;
var speedbugIndex = $.args.key.getSpeedbugIndex();

var PlatformSpecific = require('ui/PlatformSpecific');
var Topics = require('ui/Topics');

var DEBUG = false;

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  closeEditScreen();
  clearTileCache();
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
  $.TopLevelWindow.removeEventListener('swipe', swipeListener);
});

function swipeListener(e){
	if ( e.direction === 'right' && getScrollOffset() == 0) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, { swipe: true, name: $.name, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } );
	}
}
$.TopLevelWindow.addEventListener('swipe', swipeListener);

var anchorBar = $.getAnchorBar();
$.completeBtn = anchorBar.createToolBarButton( null, Topics.COMPLETE, "Next");
anchorBar.addTool( $.completeBtn );

// Keeps track of the tile views we cache
var tileIndex = [];
var firstTwoTiles = null;

function getScrollOffset() {
  return PlatformSpecific.convertSystemToDip( $.content.getContentOffset().x );
}

function getViewWidth() {
  return PlatformSpecific.convertSystemToDip( $.content.getSize().width );
}

function getEndcapWidth() {
  return getEndcapHeight()*0.5;
}

function getEndcapHeight() {
  return PlatformSpecific.convertSystemToDip( $.content.getSize().height ); 
}


function getMiddleWidth() {
  return getEndcapWidth()*1.3;
}

// TODO: Factor Tile into a controller and handle clean up there?
function cleanUpTile( tile ) {
  tile.icons.forEach( function(icon ) {
    if ( icon.handler )
      icon.view.removeEventListener("click",icon.handler);
    if ( icon.controller )
      icon.controller.cleanUp();
  });
}

function clearTileCache() {
  for( var i = 0; i<=tileIndex.length; i++ ) {
    var tile = tileIndex[i];
    if ( typeof( tile ) !== "undefined" ) {
      $.content.remove( tile.container );
      cleanUpTile( tile );
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
  var middleWidth = getMiddleWidth();
  var endcapWidth = getEndcapWidth();
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
      var taxonClickHandler = function(e) {
        Ti.API.info(`firing edit event` );
        icon.fireEditEvent();
        e.cancelBubble = true;
      };
      thumbnail.addEventListener("click", taxonClickHandler );
      thumbnail.add( icon.getView() );
      return {
        view: thumbnail,
        controller: icon,
        handler: taxonClickHandler
      };
    }
  } else if ( index === Alloy.Collections["taxa"].length ) {
    thumbnail.add( createAddIcon() );
  } else {
    thumbnail.addEventListener( "click", startIdentification );
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
              width: "73%",
              height: `${getEndcapHeight()}dip`,
              left: "27%",
              layout: "vertical"
            }),
      icons: []
    };
    if ( DEBUG ) {
      firstTwoTiles.borderColor = "yellow";
    }
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
  var iconContainer = Ti.UI.createView( {
    top: 0,
    width: `${getMiddleWidth()/2-1}dip`,
    height: "50%"
  });
  if ( DEBUG ) {
    iconContainer.borderColor = "green";
  }
  return iconContainer;
}

function createAddIcon() {
  var addIconCache = Ti.UI.createButton({
    top: "40%",
    left: "25%",
    width: "50%",
    height: "36%",
    accessibilityLabel: "Add",
    backgroundImage: "/images/plus-icon.png"
  });
  addIconCache.addEventListener( "click", startIdentification );
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
  var middleWidth = getMiddleWidth();
  var endcapWidth = getEndcapWidth();
  var endcapHeight = getEndcapHeight();
  var tile = Ti.UI.createView({
    height: `${endcapHeight}dip`,
    width: `${middleWidth+1}dip`,
    left: `${tileNum*middleWidth+endcapWidth}dip`
  });
  if ( DEBUG ) {
    tile.borderColor = "yellow";
  }
  var trayBackground =  Ti.UI.createImageView({
        image: '/images/tiling_interior_320.png',
        height: Ti.UI.FILL,
        width: Ti.UI.FILL
  });
  tile.add( trayBackground );
  
  if ( DEBUG ) {
   var debugNumber = Ti.UI.createLabel({color: "gray", text: tileNum, font: {fontSize: 150 } });
    tile.add( debugNumber );
  }
  
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
  if ( DEBUG ) {
    Ti.API.debug(`releaseTiles(${start_n},${end_n})`);
  }
  for( var i = start_n; i<=end_n; i++ ) {
    if ( i >=  0 ) {
      var tile = tileIndex[i];
      if ( typeof( tile ) !== "undefined" ) {
        $.content.remove( tile.container );
        cleanUpTile( tile );
        delete tileIndex[i];
      }
    }
  }
}

function addTiles( start_n, end_n ) {
  if ( DEBUG ) {
    Ti.API.debug(`addTiles(${start_n},${end_n})`);
  }
  for( var i = start_n; i<=end_n; i++ ) {
    // max() below is to add an extra blank tile with an empty tray...
    if ( i >=  0 && ( i <= Math.max((Alloy.Collections["taxa"].length - 2)/4,3) ) ) {
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
  var viewWidth = getViewWidth();
  var middleWidth = getMiddleWidth();
  var endcapWidth = getEndcapWidth();
  var rightEdge = roundToTile( scrollx + viewWidth + middleWidth );
  var leftEdge = roundToTile( scrollx - middleWidth - endcapWidth );
  if ( DEBUG ) {
    Ti.API.debug(`viewWidth=${viewWidth}, middleWidth=${middleWidth}, encapWidth=${endcapWidth}, endcapHeight=${getEndcapHeight()}`);
  }
  addTiles(leftEdge,rightEdge);
  releaseTiles( 0, leftEdge - 1 );
  releaseTiles( rightEdge, tileIndex.length );
}

function drawIcecubeTray() {
    updateFirstTwoSampleTrayIcons();
    updateVisibleTiles( getScrollOffset() );
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
    var surveyType = parseInt( Alloy.Models.sample.get("surveyType") );
    Topics.fireTopicEvent( Topics.KEYSEARCH, { allowAddToSample: true, surveyType: surveyType  }  );
  });

  $.selectMethod.on("speedbug", function() {
    closeSelectMethod();
    var surveyType = parseInt(Alloy.Models.sample.get("surveyType"));
    Topics.fireTopicEvent( Topics.SPEEDBUG, { allowAddToSample: true, surveyType: surveyType  }  );
  });

  $.selectMethod.on("browselist", function() {
    closeSelectMethod();
    var surveyType = parseInt(Alloy.Models.sample.get("surveyType"));
    Topics.fireTopicEvent( Topics.BROWSE, { allowAddToSample: true, surveyType: surveyType  }  );
  });

  $.TopLevelWindow.add($.selectMethod.getView());

  e.cancelBubble = true;
};

// In order to get the correct dimensions for the end cap image
// we create the endcap tile based on the measured height of the
// "content" pane. Then the tile width and height are based off
// this standard measure to ensure consistency.
//
// We rely on the postlayout event to set this initial position.
function drawEndcapTile() {
 $.endcap = Ti.UI.createView({ 
   left: 0,
   top: 0,
   height: `${getEndcapHeight()}dip`,
   width: `${getEndcapWidth()}dip`
  })
  $.content.add( $.endcap );
  $.endcap.add( Ti.UI.createImageView({ 
    image: "/images/endcap_320.png",
    width: Ti.UI.FILL,
    height: Ti.UI.FILL
  }));
}


function initializeTray() {
    drawEndcapTile();
    clearTileCache();
    drawIcecubeTray();
}

//$.content.addEventListener( "click", startIdentification );
$.content.addEventListener( "scroll", drawIcecubeTray );

$.content.addEventListener( "postlayout", function initEvent() {
  $.content.removeEventListener( "postlayout", initEvent );
  initializeTray();
});
 
Alloy.Collections["taxa"].on("add change remove", drawIcecubeTray );

$.getView().addEventListener( "close", function cleanup() {
  $.content.removeEventListener("scroll", drawIcecubeTray);
  Alloy.Collections["taxa"].off("add change remove", drawIcecubeTray );
  $.getView().removeEventListener("close", cleanup);
});

function closeEditScreen() {
  if ( typeof $.editTaxon === "object" ) {
    $.getView().remove( $.editTaxon.getView() );
    $.editTaxon.cleanUp();
    delete $.editTaxon;
  }
}

function editTaxon( taxon_id ) {
  var taxon = Alloy.Collections["taxa"].get( taxon_id );
  var sample = Alloy.Models.sample;
  if ( !taxon ) {
    taxon = Alloy.createModel( 'taxa', { sampleId: sample.get('sampleId'), taxonId: taxon_id, abundance: "1-2" } );
  }
  $.editTaxon = Alloy.createController("EditTaxon", { taxon: taxon, key: key } );
  $.getView().add( $.editTaxon.getView() );
  
  $.editTaxon.on("close", function() {
    closeEditScreen();
  });

  $.editTaxon.on("delete", function() {
    closeEditScreen();
    Alloy.Collections["taxa"].remove( taxon );
    taxon.destroy();
  });

  $.editTaxon.on("save", function() {
    closeEditScreen();
    taxon.save();
    Alloy.Collections["taxa"].add( taxon );
    
  });
}

function openWindow() {
  editTaxon( $.args.taxonId );
}

if ( $.args.taxonId ) {
  $.TopLevelWindow.addEventListener("open", openWindow );
  $.TopLevelWindow.addEventListener("close", function closeWindow() {
    $.TopLevelWindow.removeEventListener("open", openWindow );
    $.TopLevelWindow.removeEventListener("close", closeWindow );
  })
}
exports.editTaxon = editTaxon;
