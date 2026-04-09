require("spec/lib/mocha");
var { expect } = require('spec/lib/chai');
var KeyNode = require('logic/Key');
var Question = require('logic/Question');

describe('KeyNode tests', function() {
	var kn = KeyNode.createKeyNode( {
		questions: [
			Question.createQuestion({
				text: "Question 1",
				outcome: null,
				mediaUrls: [ "spec/resources/simpleKey1/media/amphipoda_01.jpg" ]
			}),
			Question.createQuestion({
				text: "Question 2",
				outcome: null,
				mediaUrls: [ "spec/resources/simpleKey1/media/amphipoda_02.jpg", "spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]
			})
		],
		parentLink: null
	});

	it('should store both questions', function(){
		expect( kn.questions.length).to.equal(2);

		expect(kn.questions[0].text).to.equal("Question 1");
		expect(kn.questions[0].mediaUrls).to.have.members([ "spec/resources/simpleKey1/media/amphipoda_01.jpg" ]);

		expect(kn.questions[1].text).to.equal("Question 2");
		expect(kn.questions[1].mediaUrls).to.have.members([ "spec/resources/simpleKey1/media/amphipoda_02.jpg", "spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ]);
	});
});
