/*
 * walta/BrowseView
 *
 * Enables the taxonomy endpoints to be browsed.
 *  
 */

var _ = require('lib/underscore')._;
var PubSub = require('lib/pubsub');
var Layout = require('ui/Layout');
var Topics = require('ui/Topics');

function createBrowseView(  /* Key */ key ) {
	
	var bvObj = {
		view: null,			 	// The Ti.UI.View for the user interface
		_views: {},					// sub views
		key: key                	// The Key data
	};
	
	var vws = bvObj._views;
	
	
	// Create a data set that displays all the taxon species
	var dataSet = [];
	_.each(bvObj.key.findAllTaxons(),function( txn ) {
		dataSet.push( {
			title: { text: txn.name },
			properties: { 
				itemId: txn.id,
				backgroundColor: (dataSet.length % 2 == 0 ? 'white' : '#552F61CC')
			}
		});
	});
	
	var taxonSection = Ti.UI.createListSection();
	taxonSection.setItems( dataSet );
	
	
	var bView = Ti.UI.createListView({
		templates: { 
			'template': {
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
			   } 
			},
		defaultItemTemplate: 'template'
	});
	
	
	bView.appendSection( taxonSection );

	bvObj.view = bView;
	
	return bvObj;
};
exports.createBrowseView = createBrowseView;