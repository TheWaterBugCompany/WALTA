require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, clearDatabase } = require('spec/util/TestUtils');
var { makeSampleData } = require("spec/fixtures/SampleData_fixture");
var Topics = require('ui/Topics');
var Sample = require('logic/Sample');

describe('SampleEditMenu', function() {
	var mnu, win;
	before( function(done) {
		mnu = Alloy.createController("SampleEditMenu", { sampleId: 1 });
		win = wrapViewInWindow( mnu.getView() );
		windowOpenTest( win, done );
	});

	after( function(done) {
		closeWindow( win, done );
	});

	it('fires SITEDETAILS readonly=true when View is tapped', function(done) {
		function handler(e) {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			expect( e.readonly ).to.equal( true );
			done();
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.view.fireEvent("click");
	});

	it('fires SITEDETAILS readonly=false when Edit is tapped', function(done) {
		function handler(e) {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			expect( e.readonly ).to.equal( false );
			done();
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.edit.fireEvent("click");
	});
});

// Opening a finished sample from history must not disturb the survey the user
// has unfinished — if it repoints the current-sample singleton, the next
// "start survey" reads it as finished and replaces the unfinished one.
describe('SampleEditMenu opened over an unfinished survey', function() {
	var mnu, win, inFlight, finished;

	beforeEach( function(done) {
		clearDatabase();
		inFlight = makeSampleData({ dateCompleted: null, serverSampleId: null, waterbodyName: "in flight" });
		inFlight.save();
		finished = makeSampleData({ serverSampleId: 99 });
		finished.save();
		Alloy.Models.instance("sample").loadCurrent().then( function() {
			mnu = Alloy.createController("SampleEditMenu", { sampleId: finished.get("sampleId") });
			win = wrapViewInWindow( mnu.getView() );
			windowOpenTest( win, done );
		});
	});

	afterEach( function(done) {
		closeWindow( win, done );
	});

	it('keeps the unfinished survey current when View is tapped', function(done) {
		function handler() {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			try {
				Alloy.Collections.instance("sample").startNewSurveyIfComplete( Sample.SURVEY_DETAILED, 38 );
				expect( Alloy.Models.sample.get("sampleId"), "reopens the unfinished survey" )
					.to.equal( inFlight.get("sampleId") );
				done();
			} catch(e) { done(e); }
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.view.fireEvent("click");
	});

	it('keeps the unfinished survey current when Edit is tapped', function(done) {
		function handler() {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			try {
				Alloy.Collections.instance("sample").startNewSurveyIfComplete( Sample.SURVEY_DETAILED, 38 );
				expect( Alloy.Models.sample.get("sampleId"), "reopens the unfinished survey" )
					.to.equal( inFlight.get("sampleId") );
				done();
			} catch(e) { done(e); }
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.edit.fireEvent("click");
	});
});
