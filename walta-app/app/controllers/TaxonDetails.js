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
 * TaxonDetails
 *
 * Displays the details of a Taxon endpoint.
 *
 */

var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Details";
$.name = "decision";
var actions = [];

function addActionButton( image, label, action ) {
	var ctl = Alloy.createController("ActionButton", { 
		image: image, 
		label: label,
		action: action
	});
	actions.push(ctl);
	$.actionBtns.add(ctl.getView());
}

$.TopLevelWindow.addEventListener('close', function cleanUp() {
	$.destroy();
	$.off();
	actions.forEach( (a) => a.cleanUp() );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

$.taxon = $.args.taxon;

$.title.text = $.taxon.commonName;
$.taxon.scientificName.forEach( (part) => {
	var label = $.UI.create('Label',{ text: `${part.taxonomicLevel}: ${part.name}` });
	$.addClass( label, "detailsText");
	if ( part.taxonomicLevel === "genus" || part.taxonomicLevel === "species" ) {
		$.addClass( label, "italics"); 
	}
	$.scientificClassification.add( label );
});
$.size.text = $.taxon.size; 
$.habitat.text = $.taxon.habitat;
$.movement.text = $.taxon.movement;
$.confusedWith.text = $.taxon.confusedWith;
$.signalScore.text = $.taxon.signalScore;
$.description.text = $.taxon.description;

// If there are photos add the photo view and button
if ($.args.taxon.photoUrls.length > 0) {
	$.photoSelect.setImage( $.taxon.photoUrls );
	addActionButton( "/images/gallery-icon.png", "Photo gallery",
		function(e) {
			$.photoSelect.openGallery();
			e.cancelBubble = true;
		}
	);
}

// If there is a video add the video button
if ($.args.taxon.videoUrl) {
	addActionButton("/images/icon-video.png", "Watch video",
		function(e) {
			Topics.fireTopicEvent( Topics.VIDEO, { url: $.taxon.videoUrl } );
			e.cancelBubble = true;
		});
}

// Add the add to sample button
Ti.API.debug(`taxonallowAddToSample = ${$.args.allowAddToSample}`);
if ( $.args.allowAddToSample !== false ) {
	addActionButton("/images/plus-icon.png", "Add To Sample",
			function(e) {
				Topics.fireTopicEvent( Topics.IDENTIFY, { taxonId: $.taxon.taxonId } );
				e.cancelBubble = true;
	});
}

function swipeListener(e){
	if ( e.direction === 'right' ) {
		e.cancelBubble = true;
		Topics.fireTopicEvent( Topics.BACK, $.name  );
	}
}

$.content.addEventListener('swipe', swipeListener);

$.getView().addEventListener( "close", function cleanup() {
  $.content.removeEventListener('swipe', swipeListener);
  $.content.removeEventListener('swipe', cleanup);
});

var acb = $.getAnchorBar();
$.args.name = "decision";
var goBackBtn = Alloy.createController("GoBackButton", $.args );
acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } ), true );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } ), true );
acb.addTool( goBackBtn.getView() );
