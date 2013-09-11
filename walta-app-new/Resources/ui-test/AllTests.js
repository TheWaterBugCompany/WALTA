//
// Rudimentary test harness to allow manual tests of UI components
// TODO: Move over to Anvil and add verification tests.
//

var _ = require('lib/underscore')._;

var AllTests = [
	'AnchorBarTest',
	'PhotoViewTest',
	'QuestionViewTest',
	'TaxonViewTest',
	'VideoViewTest',
	'KeyViewTest',
	'KeyLoaderTest'
];

function displayTestChooser() {	
	var testList = Ti.UI.createListView();
	var listSection = Ti.UI.createListSection({ headerTitle: 'Tests' });
	listSection.setItems( 
		_(AllTests).map( function( t ) { return { properties: { title: t, itemId: t, font: { fontSize: 24, font: 'Tahoma' }  } } } )
	); 
	testList.appendSection( listSection );
	
	testList.addEventListener( 'itemclick', 
		function(e){
			var test = require('ui-test/' + e.itemId);
			test.run();
		});
	
	var win = Ti.UI.createWindow( { backgroundColor: 'white', orientationModes: [ Ti.UI.LANDSCAPE_LEFT ]} );
	win.add(testList);
	win.open();
}

exports.run = displayTestChooser;