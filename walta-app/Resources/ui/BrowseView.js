/*
 * walta/BrowseView
 *
 * Enables the taxonomy endpoints to be browsed.
 *  
 */
function createBrowseView(  /* Key */ key ) {
	
	var _ = require('lib/underscore')._;
	var PubSub = require('lib/pubsub');
	var Layout = require('ui/Layout');
	var Topics = require('ui/Topics');
	
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
		dataSet.push( {
			title: { text: txn.name },
			template: ( (txn.taxonomicLevel == 'species' || txn.taxonomicLevel == 'genus') ? 'genusOrSpecies': 'default' ),
			properties: { itemId: txn.id }
		});
		if ( txn.commonName != '') {
			dataSet.push( {
				title: { text: txn.commonName },
				properties: { itemId: txn.id }
			});
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
			     	PubSub.publish( Topics.JUMPTO, e.itemId );
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
			     	PubSub.publish( Topics.JUMPTO, e.itemId );
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