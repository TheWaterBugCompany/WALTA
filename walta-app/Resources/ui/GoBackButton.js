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