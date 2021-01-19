var key = $.args.key;
var speedbugIndex = $.args.key.getSpeedbugIndex();

var PlatformSpecific = require('ui/PlatformSpecific');
var Topics = require('ui/Topics');

var DEBUG = false; // WARNING turning this on breaks unit tests

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Sample";
$.name = "sampletray";
$.TopLevelWindow.useUnSafeArea = true;
$.noSwipeBack();

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  closeEditScreen();
  clearTileCache();
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var readOnlyMode = $.args.readonly === true;
var acb = $.getAnchorBar(); 
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.HABITAT, slide: "left", readonly: readOnlyMode }  ); 
$.nextButton = Alloy.createController("GoForwardButton", { topic: Topics.COMPLETE, slide: "right", readonly: readOnlyMode } ); 
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );

// Keeps track of the tile views we cache
var tileIndex = []; // TODO: extract a class to make this datastrcuture easier to comphrend
/*
  tileIndex  = [
    {
      icons: [
        {
          view: ...
          *controller: ...
          *handler: ...
          * means only when a taxon is present
        }
      ]
    }
  ]
*/

var firstTwoTiles = null;

function getScrollOffset() {
  return PlatformSpecific.convertSystemToDip( $.content.contentOffset.x );
}

function getViewWidth() {
  return PlatformSpecific.convertSystemToDip( $.content.size.width );
}

function getEndcapWidth() {
  return getEndcapHeight()*0.5;
}

function getEndcapHeight() {
  return PlatformSpecific.convertSystemToDip( $.content.size.height ); 
}


function getMiddleWidth() {
  return getEndcapWidth()*1.3;
}

function getTrayWidth() {
  let taxons = Alloy.Collections["taxa"].length - 2;
  let tiles = Math.floor(taxons / 4) + 1;
  let width = tiles*getMiddleWidth() + getEndcapWidth();
  if ( width < getViewWidth() )
    return getViewWidth();
  else
    return width;
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
      $.tray.remove( tile.container );
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



function mapTileNumToCollection( n ) {
  return n*4+2;
}

/* addTrayIcon and updateTrayIcon return a controller if and only if
   one was created */

// CODE SMELL: Why don't we bind to the events on the collection to trigger these
// updates. This could be done even in the icon controller - hopefully avoiding all
// adding/removing logic, adding/creating event handlers etc.
//
// Each tray cell should be responsible for maintaining its event handlers etc.
// so updates don't require this dance.

function addTaxonTrayIcon( taxon, thumbnail ) {
  
  var icon = createTaxaIcon( taxon );
  var taxonClickHandler = function(e) {
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


function addTrayIcon( container, index ) {
  var thumbnail = createIconContainer();
  container.add( thumbnail );
  if ( index < Alloy.Collections["taxa"].length) {
    var taxon = Alloy.Collections["taxa"].at(index);
    if ( typeof( taxon ) !== "undefined" ) {
      return addTaxonTrayIcon( taxon, thumbnail );
    }
  } else if ( index === Alloy.Collections["taxa"].length ) {
    if ( !readOnlyMode ) {
      thumbnail.add( createAddIcon() );
    }
    return {
      view: thumbnail
    }
  } else {
    if ( !readOnlyMode ) {
      thumbnail.addEventListener( "click", startIdentification );
      return {
        view: thumbnail,
        handler: startIdentification
      }
    } else {
      return { view: thumbnail }
    }
    
  }
  
}

function updateTrayIcon( icon, index ) {
  if ( index < Alloy.Collections["taxa"].length) {
    var taxon = Alloy.Collections["taxa"].at(index);
    if ( typeof( taxon ) !== "undefined" ) {
      if ( typeof( icon.controller ) !== "undefined" ) {
        icon.controller.update(taxon);
      } else {
        icon.view.removeAllChildren();
        if ( icon.handler )
          icon.view.removeEventListener( "click", icon.handler );

        var newIcon = addTaxonTrayIcon( taxon, icon.view );
        icon.controller = newIcon.controller;
        icon.handler = newIcon.handler;
      }
    }
  } else if ( index === Alloy.Collections["taxa"].length ) {
    if ( ! icon.plusIcon &&  !readOnlyMode ) {
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
    accessibilityLabel: "Add Sample",
    backgroundImage: "/images/plus-icon.png"
  });
  if ( !readOnlyMode ) {
    addIconCache.addEventListener( "click", startIdentification );
  }
  return addIconCache;
}

function createTaxaIcon(taxon) {
  var speedbugIcon = Alloy.createController( "SampleTaxaIcon", {
      taxon: taxon,
      speedbugIndex: speedbugIndex,
      readonly: readOnlyMode
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
    height: `${endcapHeight}dp`,
    width: `${middleWidth+1}dp`,
    left: `${tileNum*middleWidth+endcapWidth}dp`
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
    Ti.API.info(`releaseTiles(${start_n},${end_n})`);
  }
  for( var i = start_n; i<=end_n; i++ ) {
    if ( i >=  0 ) {
      var tile = tileIndex[i];
      if ( typeof( tile ) !== "undefined" ) {
        $.tray.remove( tile.container );
        cleanUpTile( tile );
        delete tileIndex[i];
      }
    }
  }
}

function addTiles( start_n, end_n ) {
  if ( DEBUG ) {
    Ti.API.info(`addTiles(${start_n},${end_n})`);
  }
  for( var i = start_n; i<=end_n; i++ ) {
   if ( i >=  0 ) {
     var tile;
     if ( typeof( tileIndex[i] ) !== "undefined") {
       updateSampleTrayTile( i );
    } else {
        tile = createSampleTrayTile( i );
        tileIndex[i] = tile;
        $.tray.add( tile.container );
      }
    }
  }
}

function roundToTile( x ) {
  var middleWidth = getMiddleWidth();
  var endcapWidth = getEndcapWidth();
  return Math.floor((x - endcapWidth) / middleWidth);
}

function updateVisibleTiles( scrollx) {
  var viewWidth = getViewWidth();
  var middleWidth = getMiddleWidth();
  var endcapWidth = getEndcapWidth();

  var rightEdge = roundToTile( scrollx + viewWidth + middleWidth - 1 );
  var leftEdge = roundToTile( scrollx );
  if ( DEBUG ) {
    Ti.API.info(`viewWidth=${viewWidth}, middleWidth=${middleWidth}, encapWidth=${endcapWidth}, endcapHeight=${getEndcapHeight()}, leftEdge=${leftEdge}, rightEdge=${rightEdge}`);
  }
  addTiles(leftEdge,rightEdge - 1);
  releaseTiles( 0, leftEdge-1 );
  releaseTiles( rightEdge, tileIndex.length );
}

function drawIcecubeTray() {
  /* If you save a taxon, this for some reasons calls this method without valid view size values. Its not clear to me why they aren't set
     since you can see the tray behind the edit screen. But this cancels the redraw if the controller hasn't yet set its size values */
  if ( $.content.size.height === 0 ) {
    if ( DEBUG ) {
      Ti.API.info("view not yet initialised skipping redraw!")
    }
    return;
  }

  // froce the contentWidth to update - on iOS this doesn't seem to be automatic
  if ( DEBUG ) {
    Ti.API.info(`trayWidth=${getTrayWidth()}, viewWidth=${getViewWidth()}, scrollOffset=${getScrollOffset()}`);
  }
  $.tray.width = `${getTrayWidth()}dp`;
  $.contentWidth = `${getTrayWidth()}dp`;
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
  $.tray.add( $.endcap );
  $.endcap.add( Ti.UI.createImageView({ 
    image: "/images/endcap_320.png",
    width: Ti.UI.FILL,
    height: Ti.UI.FILL
  }));
}



function scrollToRightEdge() {
  var rightEdge = PlatformSpecific.convertDipToSystem( getTrayWidth() - getViewWidth() );
  return new Promise( function( resolve ) {
        function isAtScrollX(e) {
          if ( Math.abs(e.x - rightEdge) < 1.0 ) {
            $.content.removeEventListener("scroll",isAtScrollX);
            setTimeout( resolve, 5 );
          }
        } 
        $.content.addEventListener("scroll", isAtScrollX );
        setTimeout(() => $.content.scrollTo( rightEdge, 0, { animate: true }), 0  );
      }).then( () => $.trigger("scrollrightend") ); 
}


function initializeTray() {
  $.tray.width = getTrayWidth() + 'dp';
  drawEndcapTile();
  clearTileCache();
  drawIcecubeTray();
}

let timeoutHandler = null;

function timeoutOnDrag() {
  if ( getScrollOffset() === 0 ) {
    console.log("firing back");
    Topics.fireTopicEvent( Topics.BACK );
  } 
}

function handleDragStart(e) {
  console.log(`offset is ${getScrollOffset()}`);
  if ( getScrollOffset() === 0 ) {
    
    timeoutHandler = setTimeout(timeoutOnDrag,200);
  }
}

function handleDragEnd(e) {
  if ( timeoutHandler ) {
    console.log("timing out");
    clearTimeout(timeoutHandler);
    timeoutHandler = null;
  } 
}

$.content.addEventListener( "scroll", drawIcecubeTray );

/*
$.TopLevelWindow.addEventListener("dragstart", handleDragStart );
$.TopLevelWindow.addEventListener("dragend", handleDragEnd );
*/

$.content.addEventListener( "postlayout", function initEvent() {
  $.content.removeEventListener( "postlayout", initEvent );
  initializeTray();
  scrollToRightEdge();
});

Alloy.Collections["taxa"].on("add change remove", () => {
  drawIcecubeTray();
  scrollToRightEdge();
});

$.getView().addEventListener( "close", function cleanup() {
  $.TopLevelWindow.removeEventListener("dragstart", handleDragStart ); 
  $.TopLevelWindow.removeEventListener("dragend", handleDragEnd );
  $.content.removeEventListener("scroll", drawIcecubeTray );
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
  var taxon = Alloy.Collections["taxa"].find( (t) => t.get("taxonId") === taxon_id);
  if (!taxon ) {
    var taxons = Alloy.createCollection("taxa"); 
    taxons.loadTemporary(taxon_id); 
    taxon = taxons.first();
    if ( !taxon ) {
      // creates a taxa but leaves it unlinked from sample until save event recieved
      Ti.API.info("creating new taxon as temporary taxon")
      taxon = Alloy.createModel( 'taxa', { taxonId: taxon_id, abundance: "1-2" } );
      taxon.save();
    } else {
      Ti.API.info(`existing temporary taxon ${JSON.stringify(taxon)}`);
    }
  } else {
    Ti.API.info(`existing persisted taxon ${JSON.stringify(taxon)}`);
  }
  var sample = Alloy.Models.sample;
  
  $.editTaxon = Alloy.createController("EditTaxon", { taxon: taxon, key: key, readonly: readOnlyMode } );
  $.getView().add( $.editTaxon.getView() );
  
  $.editTaxon.on("close", function() {
    // closes but leaves temporary state untouched
    closeEditScreen();
  });

  $.editTaxon.on("delete", function(taxon) {
    Alloy.Collections.taxa.remove( taxon );
    taxon.destroy();
    closeEditScreen();
  });

  // called to persist temporarily
  $.editTaxon.on("persist", function(taxon) {
    taxon.save();
  });

  $.editTaxon.on("save", function(taxon) {
    taxon.set("sampleId", sample.get("sampleId"));
    Alloy.Collections.taxa.add( taxon );
    taxon.save();
    closeEditScreen();
    $.trigger("taxonSaved"); 
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
 
// needed for testing
function getTileIndex() {
  return { tileIndex: tileIndex, firstTwoTiles: firstTwoTiles };
}

exports.getTileIndex = getTileIndex;
exports.editTaxon = editTaxon;
exports.getTrayWidth = getTrayWidth;
exports.getViewWidth = getViewWidth;
