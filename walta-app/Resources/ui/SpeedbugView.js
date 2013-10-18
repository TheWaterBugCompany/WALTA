/*
 * ui/SpeedbugView
 *
 * Display a list of silhouettes that jump into a branch of the
 * key hierarchy.  
 *  
 */

var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

function createSpeedbugView(  /* Key */ key ) {
	var sbvObj = {
		view: null,		// The Ti.UI.View for the user interface
		_views: {},		// sub views
		key: key        // The Key data
	};
	
	var vws = sbvObj._views;
	
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
	  top: Layout.WHITESPACE_GAP,
	  left: Layout.WHITESPACE_GAP,
	  right: Layout.WHITESPACE_GAP
	});
	
	// Iterate the speed bug index groups and create a view with a "Not Sure?"
	// button that spans all the silhouettes in the group.
	sbug = sbvObj.key.getSpeedbugIndex();
	_(sbug).each( function( sg ) {
		var grpCnt = Ti.UI.createView( { 
				layout: 'vertical', 
				width: Ti.UI.SIZE , 
				height: Ti.UI.FILL
			 } );
			 
		var bugsCnt = Ti.UI.createView( { layout: 'horizontal', horizontalWrap: false, height: '83%', width: Ti.UI.SIZE } );
		
		_(sg).each( function( sb ) {
			var cnt = Ti.UI.createView( {
				backgroundColor:'white',
				  
				  height: Ti.UI.FILL,
				  width: '150dip',
				  borderColor: 'blue',
				  borderWidth: '1dip',
			});
			
			cnt.add(
				Ti.UI.createImageView({ 
				  image: sb.imgUrl,
				  width: Ti.UI.FILL
			}));
			
			cnt.addEventListener( 'click', function(e) {
				PubSub.publish( Topics.JUMPTO, sb.refId );
				e.cancelBubble = true;
			});
			
			bugsCnt.add( cnt );
		});
		
		grpCnt.add(bugsCnt);
		
		if ( bugsCnt.children.length >= 2 ) {
			var notSureBtn = Ti.UI.createLabel( {
				height: '10%',
				left: Layout.BUTTON_MARGIN,
				right: Layout.BUTTON_MARGIN,
				top: Layout.WHITESPACE_GAP,
				bottom: Layout.BUTTON_MARGIN,
				text: 'Not Sure?',
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
				font: { font: Layout.TEXT_FONT, fontSize:  Layout.QUESTION_TEXT_SIZE },
				color: 	'blue',
				backgroundColor: '#552F61CC'
			});
			
			notSureBtn.addEventListener( 'click', function(e) {
				PubSub.publish( Topics.JUMPTO, sg.refId );
				e.cancelBubble = true;
			});
			
			grpCnt.add( notSureBtn);
		}
		scrollView.add( grpCnt );
	} );
	
	sbvObj.view = scrollView;
	
	return sbvObj;
};
exports.createSpeedbugView = createSpeedbugView;