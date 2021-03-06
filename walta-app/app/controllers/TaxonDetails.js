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
var Topics = require('ui/Topics');
var PlatformSpecific = require('ui/PlatformSpecific'); 
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Details";
$.name = "decision";
var actions = [];

$.TopLevelWindow.addEventListener('close', function cleanUp() {
	$.destroy();
	$.off();
	actions.forEach( (a) => a.cleanUp() );
	$.TopLevelWindow.removeEventListener('close', cleanUp );
});

function addActionButton( image, label, action ) {
	var ctl = Alloy.createController("ActionButton", { 
		image: image, 
		label: label,
		action: action
	});
	actions.push(ctl);
	$.actionBtns.add(ctl.getView());
}

$.taxon = $.args.node;

$.title.text = $.taxon.commonName;
$.taxon.scientificName.forEach( (part) => {
	var label = $.UI.create('Label',{ text: `${part.taxonomicLevel}: ${part.name}` });
	$.addClass( label, "detailsText");
	if ( part.taxonomicLevel === "genus" || part.taxonomicLevel === "species" ) {
		$.addClass( label, "italics"); 
	}
	$.scientificClassification.add( label );
});
$.size.text = $.taxon.size + " mm"; 
$.habitat.text = $.taxon.habitat;
$.movement.text = $.taxon.movement;
$.confusedWith.text = $.taxon.confusedWith;
$.signalScore.text = $.taxon.signalScore;
$.description.text = $.taxon.description;


function goUp(e) {
	if (PlatformSpecific.convertSystemToDip(e.x) < (PlatformSpecific.convertSystemToDip($.header.size.width)*0.2)) {
		Topics.fireTopicEvent( Topics.UP, { node: $.taxon.parentLink, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, slide: "left" } );
	}
}

// Add the go up action
/*addActionButton("/images/up-icon.png", "",
	function(e) {
		Topics.fireTopicEvent( Topics.UP, { node: $.taxon.parentLink, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } );
		e.cancelBubble = true;
});*/

// Add the add to sample button
if ( $.args.allowAddToSample !== false ) {
	addActionButton("/images/plus-icon.png", "Add to sample",
			function(e) {
				Topics.fireTopicEvent( Topics.IDENTIFY, { taxonId: $.taxon.taxonId } );
				e.cancelBubble = true;
	});
}

// If there are photos add the photo view and button
if ($.taxon.photoUrls.length > 0) {
	$.photoSelect.setImage( $.taxon.photoUrls );
	addActionButton( "/images/gallery-icon.png", "Photo gallery",
		function(e) {
			$.photoSelect.openGallery(e);
			e.cancelBubble = true;
		}
	);
}

// If there is a video add the video button
if ($.taxon.videoUrl) {
	addActionButton("/images/icon-video.png", "Watch video",
		function(e) {
			Topics.fireTopicEvent( Topics.VIDEO, { url: $.taxon.videoUrl } );
			e.cancelBubble = true;
		});
}



var acb = $.getAnchorBar();
$.args.name = "decision";
var goBackBtn = Alloy.createController("GoBackButton", {slide: "left"});
acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } ), true );
acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } ), true );
acb.addTool( goBackBtn.getView() );
