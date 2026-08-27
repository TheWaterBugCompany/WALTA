require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, waitFor } = require('spec/util/TestUtils');
var { makeBinder } = require("util/bindView");
var createQuestion = require("mvvm/controllers/Question");
var QuestionViewModel = require("mvvm/viewmodels/Question");
var Question = require('logic/Question');

describe('Question controller', function() {
	var win, qv, ctl, selected;

	function makeQuestionWindow(question, verdict) {
		selected = false;
		var vm = new QuestionViewModel({
			key: "0", question: question, verdict: verdict || null,
			onSelect: function() { selected = true; },
		});
		qv = Alloy.createController("Question", {});
		ctl = createQuestion({
			view: qv,
			args: { rowVm: vm },
			bindView: makeBinder(function() {}, Alloy.CFG.colors),
		});
		win = wrapViewInWindow( _(qv.getView()).extend( { height: '45%', width: '98%' } ) );
		return win;
	}

	function card() { return qv.card; }

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();
		qv.destroy();
	});

	it('should display the question view with a photo', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [
				'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
				'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
				]
			}));
		windowOpenTest( win, done );
	});

	it('should display the question view without a photo', function(done) {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap without media images.",
			mediaUrls: []
			}));
		windowOpenTest( win, done );
	});

	it('should select the question when it is clicked', async function() {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "This is a test question text! With a longer question text that needs to wrap plus a couple of media images",
			mediaUrls: [ '/spec/resources/simpleKey1/media/amphipoda_01.jpg' ]
			}));
		await windowOpenTest( win );
		card().fireEvent('click', { x: 0, y: 0 });
		await waitFor( function() { return selected; } );
		expect( selected ).to.equal(true);
	});

	it('outlines a hinted question and shows its verdict', async function() {
		win = makeQuestionWindow(Question.createQuestion( {
			text: "Animal without a shell",
			mediaUrls: [ '/spec/resources/simpleKey1/media/amphipoda_01.jpg' ]
			}), "correct");
		await windowOpenTest( win );
		expect( qv.verdictIcon.image ).to.equal('/images/tick-icon.png');
		expect( qv.hintFrame.borderColor ).to.equal(Alloy.CFG.colors.success);
	});
});
