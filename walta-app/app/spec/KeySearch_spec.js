require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, controllerOpenTest, actionFiresTopicTest, setManualTests } = require('spec/util/TestUtils');

var Question = require('logic/Question');
var Key = require('logic/Key');
var Topics = require('ui/Topics');

describe('KeySearch controller', function() {
	var knv;
	before( function(done) {
		// Create a test key to display
	 var key = Key.createKey( {
		 			
					url: 'https://example.com/',
					name: 'TestTaxonomy',
					root: Key.createKeyNode({
						parentLink: {}, // suppress isRoot
						questions: [
							Question.createQuestion( {
								outcome: 1,
								text: "This is a test question text! With an longer question text that needs to wrap plus a couple of media images",
								mediaUrls: [
									'/spec/resources/simpleKey1/media/amphipoda_01.jpg'
									]
								}),
								Question.createQuestion( {
								outcome: 1,
								text: "This is the a second test question",
								mediaUrls: [
									"/spec/resources/simpleKey1/media/amphipoda_02.jpg",
									"/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4"
									]
								})
							]
					})
				});
			knv = Alloy.createController("KeySearch", { node: key.getCurrentNode(), key: key });
			controllerOpenTest( knv, done );
	});
	after( function(done) {
			closeWindow( knv.getView(), done );
	})

	it('should fire the FORWARD topic', function(done) {
		actionFiresTopicTest( knv.questions[1].Question, 'click', Topics.FORWARD, () => done() );
	});

	it('should fire the UP topic', function(done) {
		actionFiresTopicTest( knv.header, 'click', Topics.UP, () => done() );
	});

});
