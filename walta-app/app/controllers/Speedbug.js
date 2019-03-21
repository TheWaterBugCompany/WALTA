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

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar();
acb.addTool( acb.createToolBarButton( '/images/key-icon-white.png', Topics.KEYSEARCH, null, { surveyType: surveyType, allowAddToSample: $.args.allowAddToSample }  ) );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: surveyType, allowAddToSample: $.args.allowAddToSample }  ) );

var buttonMargin = parseInt( Layout.BUTTON_MARGIN );
var tileHeight = parseInt( Layout.SPEEDBUG_TILE_HEIGHT );
var tileWidth = parseInt( Layout.SPEEDBUG_TILE_WIDTH );
var spanTileX = buttonMargin*2 + tileWidth;


/*
* Given a x position in dips return the tile index
*/
function _convertToTileNum( x ) {
    return Math.floor( x / spanTileX );
}


var speedbugTileIndex = [];

function _pushTile( url, parent ) {
    speedbugTileIndex.push( { url: url, parent: parent, imageView: null } );
}

function _releaseTileImageData( n ) {
    if ( n >= 1 && n <=  speedbugTileIndex.length ) {
        var tile = speedbugTileIndex[n-1];
        if ( tile.imageView != null ) {
            tile.parent.remove( tile.imageView );
        }
        tile.imageView = null;
    }
}

function _showTileImageData( n ) {
    if ( n >= 1 && n <=  speedbugTileIndex.length ) {
        var tile = speedbugTileIndex[n-1];
        if ( tile.imageView == null ) {
            //Ti.API.debug(`tile ${n} width = ${tile.parent.rect.width} x = ${tile.parent.rect.x}`);
            tile.imageView = Ti.UI.createImageView({
                        image: tile.url,
                        width: Ti.UI.FILL
            });
            tile.parent.add( tile.imageView );
        }
    }
}

var scrollView = $.content;

function _drawSpeedBug(sbug) {
    // Iterate the speed bug index groups and create a view with a "Not Sure?"
    // button that spans all the silhouettes in the group.
    _(sbug).each( function( sg ) {
        var grpCnt = Ti.UI.createView( {
                layout: 'vertical',
                borderColor: '#b4d2d9',
                borderWidth: "1dp",
                width: Ti.UI.SIZE,
                height: Ti.UI.FILL
                } );

        var bugsCnt = Ti.UI.createView( {
            layout: 'horizontal',
            horizontalWrap: false,
            height: "83%",
            width: Ti.UI.SIZE } );

        _(sg.bugs).each( function( sb ) {
            var cnt = Ti.UI.createView( {
                backgroundColor:'white',
                    height: `${tileHeight}dp`,
                    width: `${tileWidth}dp`,
                    left: `${buttonMargin}dp`,
                    right: `${buttonMargin}dp`
            });
            //cnt.add( Ti.UI.createLabel({ width: Ti.UI.FILL, zIndex:"99", textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER, height: Ti.UI.FILL, font: { fontSize: "50dp" }, color: "red", text: (speedbugTileIndex.length + 1) }));

            // Defer loading images until they are on screen
            //Ti.API.debug('speedbug ' + sb.imgUrl );
            _pushTile( sb.imgUrl, cnt );

            cnt.addEventListener( 'click', function(e) {
                Ti.API.debug(`allowAddToSample = ${$.args.allowAddToSample}`);
                Topics.fireTopicEvent( Topics.JUMPTO, { id: sb.refId, allowAddToSample: $.args.allowAddToSample } );
                e.cancelBubble = true;
            });
 
            bugsCnt.add( cnt );
           
        });

        grpCnt.add(bugsCnt); 

        if ( bugsCnt.children.length >= 2 ) {
            var notSureBtn = Ti.UI.createLabel( {
                height: '30dp',
                width: `${bugsCnt.children.length*spanTileX - 2*buttonMargin}dp`,
                top: Layout.WHITESPACE_GAP,
                bottom: Layout.BUTTON_MARGIN,
                text: 'Not Sure?',
                textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
                font: { font: Layout.TEXT_FONT, fontSize:  Layout.QUESTION_TEXT_SIZE },
                color: 	'#26849c',
                backgroundColor: '#b4d2d9'
            });

            notSureBtn.addEventListener( 'click', function(e) {
                Ti.API.debug(`allowAddToSample = ${$.args.allowAddToSample}`);
                Topics.fireTopicEvent( Topics.JUMPTO, { id: sg.refId, allowAddToSample: $.args.allowAddToSample } );
                e.cancelBubble = true;
            });

            grpCnt.add( notSureBtn);
        }
        scrollView.add( grpCnt );
       
    } ); 
}

/* Dynamically load and release images as they move onto screen */
var lastScroll = null;
function _loadAndReleaseTiles(e) {
    // set height
    $.content.contentHeight = $.content.height;
   
    
    // getContentOffset can be undefined during postLayout
    // scrollView.getSize can be undefined during postLayout also ?
    var scrollx = ( scrollView.contentOffset ? PlatformSpecific.convertSystemToDip( scrollView.contentOffset.x ) : 0 );
   // Ti.API.debug(`contentWidth = ${$.content.contentWidth}, contentWidth - scrollx = ${parseInt($.content.contentWidth)- scrollx}`);
    if ( (lastScroll == null) || (Math.abs( scrollx - lastScroll ) > 0) ) {
        var start_n, end_n; 
        var viewWidth = PlatformSpecific.convertSystemToDip( scrollView.size? scrollView.size.width : 0 );
       // Ti.API.debug(`_convertToTileNum( scrollx ) = ${_convertToTileNum( scrollx )} scrollx = ${scrollx} spanTilex = ${spanTileX} tileWidth = ${tileWidth}`);
        
        // Release any tiles that are now off the screen
        if ( lastScroll < scrollx ) {
            start_n = _convertToTileNum( lastScroll - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
            end_n = _convertToTileNum( scrollx - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
        } else {
            start_n = _convertToTileNum( scrollx + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
            end_n = _convertToTileNum( lastScroll + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;

        }
        //Ti.API.log("Speedbug release tiles start_n = " + start_n + " end_n = " + end_n );
        for( var i = start_n; i<=end_n; i++ ) {
            _releaseTileImageData(i);
        }

        // Calculate the range of tiles that need to be shown
        start_n = _convertToTileNum( scrollx ) - Layout.SPEEDBUG_PRECACHE_TILES;
        end_n = _convertToTileNum( scrollx + viewWidth + spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
       // Ti.API.log("Speedbug load tiles start_n = " + start_n + " end_n = " + end_n );
        for( var i = start_n; i<=end_n; i++ ) {
            _showTileImageData(i);
        }

        lastScroll = scrollx;
    }
};
scrollView.addEventListener( 'scroll', _loadAndReleaseTiles );
scrollView.addEventListener( 'postlayout', _loadAndReleaseTiles );

 _drawSpeedBug( key.getSpeedbugIndex(speedbugName).getSpeedbugIndex() );