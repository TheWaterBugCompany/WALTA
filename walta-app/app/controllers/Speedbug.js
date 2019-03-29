/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/



var Layout = require('ui/Layout');
var Topics = require('ui/Topics');
var Sample = require('logic/Sample');
var PlatformSpecific = require('ui/PlatformSpecific');
var key = $.args.key;
var surveyType = $.args.surveyType;
var speedbugName = Sample.getSpeedbugIndexName( surveyType );

Ti.API.debug(`Speedbug name = ${speedbugName}`);

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Speedbug";
$.name = "speedbug";

var scrollView = $.content;
var groups = [];

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
    groups.forEach( (g) => g.cleanUp() );
    speedbugTileIndex.cleanUp();
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar();
acb.addTool( acb.createToolBarButton( '/images/key-icon-white.png', Topics.KEYSEARCH, null, { surveyType: surveyType, allowAddToSample: $.args.allowAddToSample }  ) );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: surveyType, allowAddToSample: $.args.allowAddToSample }  ) );


var tileWidth = 0;
var tileHeight = 0;
var tileGap = 0;
var spanTileX = 0;


/*
* Given a x position in dips return the tile index
*/
function _convertToTileNum( x ) {
    return Math.floor( x / spanTileX );
}


var speedbugTileIndex = {
    tiles: [],
    cleanUp: function() {
        this.tiles.forEach( (t) => t.cleanUp() );
        this.tiles = null;
    },
    pushTile: function(tile) {
        this.tiles.push(tile);
    },
    releaseImageData( n ) {
        if ( n >= 1 && n <=  this.tiles.length ) {
            var tile = this.tiles[n-1];
            tile.releaseImageData();
        }
    },
    showImageData( n ) {
        if ( n >= 1 && n <=  this.tiles.length ) {
            var tile = this.tiles[n-1];
            tile.showImageData();
        }
    }
}

function _drawSpeedBug(sbug) {
    if ( !drawnBugs ) {

        drawnBugs = true;

        // dynamically calculate the size of the speedbug view
        tileHeight = $.content.size.height  * 0.8;
        tileWidth = tileHeight * 0.7;
        tileGap = tileWidth * 0.05;
        spanTileX = tileWidth + tileGap*2;
        
        _(sbug).each( function( sg ) {
            var group = Alloy.createController("SpeedbugGroup", { tileWidth: tileWidth, tileHeight: tileHeight, tileGap: tileGap, speedbugs: sg.bugs, index: speedbugTileIndex } );
            group.on("select", (refId) => Topics.fireTopicEvent( Topics.JUMPTO, { id: refId, allowAddToSample: $.args.allowAddToSample } ) );
            groups.push(group);
            scrollView.add( group.getView() );
        } ); 
    }
}

/* Dynamically load and release images as they move onto screen */
var lastScroll = null;
var drawnBugs = false;
function _loadAndReleaseTiles(e) {
    // set height
    $.content.contentHeight = $.content.height;
    _drawSpeedBug( key.getSpeedbugIndex(speedbugName).getSpeedbugIndex() );
    
    // getContentOffset can be undefined during postLayout
    // scrollView.getSize can be undefined during postLayout also ?
    var scrollx = ( scrollView.contentOffset ? PlatformSpecific.convertSystemToDip( scrollView.contentOffset.x ) : 0 );
   // Ti.API.debug(`contentWidth = ${$.content.contentWidth}, contentWidth - scrollx = ${parseInt($.content.contentWidth)- scrollx}`);
    if ( (lastScroll == null) || (Math.abs( scrollx - lastScroll ) > 0) ) {
        var start_n, end_n; 
        var viewWidth = PlatformSpecific.convertSystemToDip( scrollView.size? scrollView.size.width : 0 );
        //Ti.API.debug(`_convertToTileNum( scrollx ) = ${_convertToTileNum( scrollx )} scrollx = ${scrollx} spanTilex = ${spanTileX} tileWidth = ${tileWidth}`);
        
        // Release any tiles that are now off the screen
        if ( lastScroll < scrollx ) {
            start_n = _convertToTileNum( lastScroll - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
            end_n = _convertToTileNum( scrollx - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
        } else {
            start_n = _convertToTileNum( scrollx + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
            end_n = _convertToTileNum( lastScroll + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;

        }
        //Ti.API.debug("Speedbug release tiles start_n = " + start_n + " end_n = " + end_n );
        for( var i = start_n; i<=end_n; i++ ) {
            speedbugTileIndex.releaseImageData(i);
        }

        // Calculate the range of tiles that need to be shown
        start_n = _convertToTileNum( scrollx ) - Layout.SPEEDBUG_PRECACHE_TILES;
        end_n = _convertToTileNum( scrollx + viewWidth + spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
        //Ti.API.debug("Speedbug load tiles start_n = " + start_n + " end_n = " + end_n );
        for( var i = start_n; i<=end_n; i++ ) {
            speedbugTileIndex.showImageData(i);
        }

        lastScroll = scrollx;
   }
};
scrollView.addEventListener( 'scroll', _loadAndReleaseTiles );
scrollView.addEventListener( 'postlayout', _loadAndReleaseTiles );

 