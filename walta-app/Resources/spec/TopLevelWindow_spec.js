require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');
var PubSub = require('lib/pubsub');
var TopLevelWindow = require('ui/TopLevelWindow');

var Topics = require('ui/Topics');

describe('TopLevelWindow', function() {

	it('should compose AnchorBar to a view', function() {
		
		
		
		var testView = Ti.UI.createView(
			{
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				backgroundColor:'red'
			}
		);
		
		var win = TopLevelWindow.makeTopLevelWindow({
			title: 'TestView',
			uiObj: { view: testView }
		});
		
		// var subs = PubSub.subscribe( Topics.BACK, function() {
			// win.close();
			// PubSub.unsubscribe(subs);
		// } );
		
	});
	

});