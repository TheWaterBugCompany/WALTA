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
 * walta/BrowseView
 *
 * Enables the taxonomy endpoints to be browsed.
 *  
 */

var Layout = require('ui/Layout');
var Topics = require('ui/Topics');
function createBrowseView(  /* Key */ key, surveyType, allowAddToSample ) {
	
	var _ = require('lib/underscore')._;

	
	var bvObj = {
		view: null,			 	// The Ti.UI.View for the user interface
		_views: {},					// sub views
		key: key                	// The Key data
	};
	
	var vws = bvObj._views;
	
	
	// Create a data set that displays all the taxon species
	var dataSet = [];
	var taxonList = bvObj.key.findAllTaxons();
	
	
	_.each( taxonList, function( txn ) {
		if ( _.findIndex( dataSet, function(i) { return i.title.text == txn.name; } ) == -1 ) {
			dataSet.push( {
				title: { text: txn.name },
				template: ( (txn.taxonomicLevel == 'species' || txn.taxonomicLevel == 'genus') ? 'genusOrSpecies': 'default' ),
				properties: { itemId: txn.id }
			});
		}
		if ( txn.commonName != '') {
			if ( _.findIndex( dataSet, function(i) { return i.title.text == txn.commonName; } ) == -1 ) {
				dataSet.push( {
					title: { text: txn.commonName },
					properties: { itemId: txn.id }
				});
			}
		}
	});
		
	// Sort list
	dataSet =_.sortBy(dataSet, function(i) { return i.title.text; });
	
	// Colour list backgrounds
	var row = 0;	
	_.each( dataSet, function( i ) {
		i.properties.backgroundColor = (row%2 == 0 ? 'white' : '#552F61CC');
		row++;
	});	
	var taxonSection = Ti.UI.createListSection();
	taxonSection.setItems( dataSet );
	
	
	var bView = Ti.UI.createListView({
		templates: { 
			'default': {
		    	childTemplates: [
			        {                             
			            type: 'Ti.UI.Label',  
			            bindId: 'title',            
			            properties: {           
			                color: 'black',
			                font: { fontFamily: Layout.TEXT_FONT, fontSize: Layout.QUESTION_TEXT_SIZE },
			                left: Layout.WHITESPACE_GAP
			            }
			        } ],
			     events: {click: function(e) {
			     	Topics.fireTopicEvent( Topics.JUMPTO, { id: e.itemId, surveyType: surveyType, allowAddToSample: allowAddToSample } );
			     } }
			   },
			'genusOrSpecies': {
		    	childTemplates: [
			        {                             
			            type: 'Ti.UI.Label',  
			            bindId: 'title',            
			            properties: {           
			                color: 'black',
			                font: { fontFamily: Layout.TEXT_FONT, fontSize: Layout.QUESTION_TEXT_SIZE, fontStyle: 'italic' },
			                left: Layout.WHITESPACE_GAP
			            }
			        } ],
			     events: {click: function(e) {
			     	Topics.fireTopicEvent( Topics.JUMPTO, { id: e.itemId, surveyType: surveyType, allowAddToSample: allowAddToSample } );
			     }}
			   } 
			},
		defaultItemTemplate: 'default'
	});
	
	
	bView.appendSection( taxonSection );

	bvObj.view = bView;
	
	return bvObj;
};
exports.createBrowseView = createBrowseView;