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

/*
 * ui/SpeedbugView
 *
 * Display a list of silhouettes that jump into a branch of the
 * key hierarchy.  
 *  
 */
function createSpeedbugView(  /* Key */ key ) {
	var _ = require('lib/underscore')._;

	var Layout = require('ui/Layout');
	var Topics = require('ui/Topics');
	var PlatformSpecific = require('ui/PlatformSpecific');
	
	var sbvObj = {
		view: null,		// The Ti.UI.View for the user interface
		_views: {},		// sub views
		key: key        // The Key data
	};
	
	var vws = sbvObj._views;
	
	var buttonMargin = Ti.UI.convertUnits( Layout.BUTTON_MARGIN, "dip" );
	var tileHeight = Ti.UI.convertUnits( Layout.SPEEDBUG_TILE_HEIGHT, "dip" );
	var tileWidth = Ti.UI.convertUnits( Layout.SPEEDBUG_TILE_WIDTH, "dip" );
	var spanTileX = buttonMargin*2 + tileWidth + 2;
	
	
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
		if ( n >= 0 && n <  speedbugTileIndex.length ) {
			var tile = speedbugTileIndex[n];
			if ( tile.imageView != null ) {
				tile.parent.remove( tile.imageView );
			}
			tile.imageView = null;
		}
	}
	
	function _showTileImageData( n ) {
		if ( n >= 0 && n <  speedbugTileIndex.length ) {
			var tile = speedbugTileIndex[n];
			if ( tile.imageView == null ) {
				tile.imageView = Ti.UI.createImageView({ 
						  image: tile.url,
						  width: Ti.UI.FILL
				});
				tile.parent.add( tile.imageView );
			}
		}
	}
	
	var scrollView = Ti.UI.createScrollView({
	  contentWidth: 'auto',
	  contentHeight: 'auto',
	  showVerticalScrollIndicator: false,
	  showHorizontalScrollIndicator: false,
	  height: Ti.UI.FILL,
	  width: Ti.UI.FILL,
	  scrollType: 'horizontal',
	  layout: 'horizontal',
	  horizontalWrap: false,
	  top: Layout.WHITESPACE_GAP
	});
	
	// Iterate the speed bug index groups and create a view with a "Not Sure?"
	// button that spans all the silhouettes in the group.
	sbug = sbvObj.key.getSpeedbugIndex();
	_(sbug).each( function( sg ) {
		var grpCnt = Ti.UI.createView( { 
				layout: 'vertical', 
				width: Ti.UI.SIZE, 
				height: Ti.UI.FILL
			 } );
			 
		var bugsCnt = Ti.UI.createView( { 
			layout: 'horizontal', 
			horizontalWrap: false, 
			height: '83%', 
			width: Ti.UI.SIZE } );
		
		_(sg.bugs).each( function( sb ) {
			var cnt = Ti.UI.createView( {
				backgroundColor:'white',
				  
				  height: tileHeight,
				  width: tileWidth,
				  borderColor: 'blue',
				  borderWidth: '1dip',
				  left: Layout.BUTTON_MARGIN,
				  right: Layout.BUTTON_MARGIN
			});
			
			// Defer loading images until they are on screen
			_pushTile( '/' + sb.imgUrl, cnt );
			
			cnt.addEventListener( 'click', function(e) {
				Topics.fireTopicEvent( Topics.JUMPTO, { id: sb.refId } );
				e.cancelBubble = true;
			});
			
			bugsCnt.add( cnt );
		});
		
		grpCnt.add(bugsCnt);
		
		if ( bugsCnt.children.length >= 2 ) {
			var notSureBtn = Ti.UI.createLabel( {
				height: '10%',
				width: bugsCnt.children.length*spanTileX - 2*buttonMargin,
				top: Layout.WHITESPACE_GAP,
				bottom: Layout.BUTTON_MARGIN,
				left: buttonMargin,
				right: buttonMargin,
				text: 'Not Sure?',
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
				font: { font: Layout.TEXT_FONT, fontSize:  Layout.QUESTION_TEXT_SIZE },
				color: 	'blue',
				backgroundColor: '#552F61CC'
			});
			
			notSureBtn.addEventListener( 'click', function(e) {
				Topics.fireTopicEvent( Topics.JUMPTO, sg.refId );
				e.cancelBubble = true;
			});
			
			grpCnt.add( notSureBtn);
		}
		scrollView.add( grpCnt );
		
		
	} );
	
	/* Dynamically load and release images as they move onto screen */
	var lastScroll = null;
	function _loadAndReleaseTiles() {
		// getContentOffset can be undefined during postLayout
		var scrollx = ( scrollView.getContentOffset() ? PlatformSpecific.convertSystemToDip( scrollView.getContentOffset().x ) : 0 );
		if ( (lastScroll == null) || (Math.abs( scrollx - lastScroll ) > spanTileX) ) {
			var start_n, end_n;
			var viewWidth = PlatformSpecific.convertSystemToDip( scrollView.getSize().width );
			
			// Release any tiles that are now off the screen
			if ( lastScroll < scrollx ) {
				start_n = _convertToTileNum( lastScroll - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
				end_n = _convertToTileNum( scrollx - spanTileX ) - Layout.SPEEDBUG_PRECACHE_TILES;
			} else {
				start_n = _convertToTileNum( scrollx + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
				end_n = _convertToTileNum( lastScroll + viewWidth + 2*spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
				
			}
			Ti.API.trace("Speedbug release tiles start_n = " + start_n + " end_n = " + end_n );
			for( var i = start_n; i<=end_n; i++ ) {
				_releaseTileImageData(i);
			}
			
			// Calculate the range of tiles that need to be shown
			start_n = _convertToTileNum( scrollx ) - Layout.SPEEDBUG_PRECACHE_TILES;
			end_n = _convertToTileNum( scrollx + viewWidth + spanTileX ) + Layout.SPEEDBUG_PRECACHE_TILES;
			Ti.API.trace("Speedbug load tiles start_n = " + start_n + " end_n = " + end_n );
			for( var i = start_n; i<=end_n; i++ ) {
				_showTileImageData(i);
			}
			
			lastScroll = scrollx;
		}
	};
	scrollView.addEventListener( 'scroll', _loadAndReleaseTiles );
	scrollView.addEventListener( 'postlayout', _loadAndReleaseTiles );
	
	sbvObj.view = scrollView;
	
	return sbvObj;
};
exports.createSpeedbugView = createSpeedbugView;