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

function addTaxon(id, name, level) {
    if ( _.findIndex( dataSet, function(i) { return i.title.text == name; } ) == -1 ) {
        dataSet.push( {
            title: { text: (level=== "order"? "Order: ":"")+name, level: level },
            properties: { itemId: id }
        });
    }
}

_.each( taxonList, function( txn ) {
    addTaxon( txn.id, txn.name, txn.taxonomicLevel );
    if ( txn.commonName != '') {
        addTaxon( txn.id, txn.commonName, txn.taxonomicLevel );
    }
});
    
// Sort list
dataSet =_.sortBy(dataSet, function(i) { 
    var key = i.title.text.toUpperCase();
    key = key.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g,"");
    if ( i.title.level === "order" ) {
        key = "AAAA" + key; // make it first by prepending AAAA
    }
    return key;
});

// Colour list backgrounds
var row = 0;	
_.each( dataSet, function( i ) {
    i.properties.backgroundColor = (row%2 == 0 ? 'white' : '#552F61CC');
    row++;
});	
var taxonSection = Ti.UI.createListSection(); 
taxonSection.setItems( dataSet );
$.content.appendSection(taxonSection);
