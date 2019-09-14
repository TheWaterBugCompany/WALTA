var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Browse";
$.name = "browse";
$.noSwipeBack();

var acb = $.getAnchorBar();
acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample:  $.args.allowAddToSample }  ) );
acb.addTool( acb.createToolBarButton( '/images/key-icon-white.png', Topics.KEYSEARCH, null, { surveyType: $.args.surveyType, allowAddToSample:  $.args.allowAddToSample }  ) );

function clickItem(e) {
    var item = $.content.sections[e.sectionIndex].getItemAt(e.itemIndex);
    console.info(`item = ${JSON.stringify(item)}`);
    Topics.fireTopicEvent( Topics.JUMPTO, { id: item.properties.itemId, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample } );
}

// Create a data set that displays all the taxon species
var dataSet = [];
var taxonList = $.args.key.findAllTaxons();


_.each( taxonList, function( txn ) {
    if ( _.findIndex( dataSet, function(i) { return i.title.text == txn.name; } ) == -1 ) {
        dataSet.push( {
            title: { text: txn.name },
            template: ( (txn.taxonomicLevel == 'species' || txn.taxonomicLevel == 'genus') ? 'genusOrSpeciesTaxon': 'taxon' ),
            properties: { itemId: txn.id}
        });
    } 
    if ( txn.commonName != '') {
        if ( _.findIndex( dataSet, function(i) { return i.title.text == txn.commonName; } ) == -1 ) {
            dataSet.push( {
                title: { text: txn.commonName  },
                properties: { itemId: txn.id}
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
$.content.appendSection(taxonSection);
