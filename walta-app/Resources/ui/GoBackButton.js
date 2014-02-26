/*
 * Module: GoBackButton
 * 
 */


function createGoBackButton() {
	var Layout = require('ui/Layout');
	var PubSub = require('lib/pubsub');
	var Topics = require('ui/Topics');
	
	var goBack = Ti.UI.createView({
		width: Ti.UI.SIZE,
		height: Ti.UI.SIZE,
		borderRadius: Layout.BORDER_RADIUS_BUTTON,
		backgroundColor: '#BB2F61CC',
		layout: 'horizontal',
		horizontalWrap: false
	});
	goBack.add( Ti.UI.createImageView( { 
		width: '55dip', 
		height: '55dip', 
		image: '/images/back.png'
	} ) );
	goBack.add( Ti.UI.createLabel( { 
		width: Layout.GOBACK_BUTTON_TEXT_WIDTH, 
		height: Ti.UI.SIZE, 
		right: '4dip',
		text: 'No match? Go back', 
		font: { fontFamily: 'Tahoma', fontSize: Layout.TOOLBAR_BUTTON_TEXT },
		color: 'white' 
	} ) );
	goBack.addEventListener( 'click', function(e) {
		PubSub.publish( Topics.BACK, null );
		e.cancelBubble = true;
	} );
	return goBack;
}

exports.createGoBackButton = createGoBackButton;