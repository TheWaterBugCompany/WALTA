require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { closeWindow, waitFor } = require('spec/util/TestUtils');
var { makeTestServices } = require("spec/fixtures/Services_fixture");

// Drives the real Account screen through the View seam — the same path the app
// takes — so the window lays out and the belt grid renders on device. The
// naming and logout decisions are covered in Node
// (test/viewmodels/Account_spec.js).
describe('Account screen', function() {
	var view, ctl;

	function open({ level = 0, user = { email: "test.user@example.com", name: "Test User" } } = {}) {
		var services = makeTestServices({
			dialogs: { confirm: function () { return Promise.resolve(true); } },
			belts: { currentLevel: function () { return level; } },
			cerdiApi: {
				retrieveUsername: function () { return "test.user@example.com"; },
				retrieveUser: function () { return Promise.resolve(user); },
				retrieveUserId: function () { return 38; },
				storeUserToken: function () {},
			},
		});
		view = services.View;
		return view.openView("Account", {}).then(function () {
			ctl = view.getCurrentController();
		});
	}

	afterEach( function(done) {
		closeWindow( ctl.getView(), done );
	});

	it('shows the account it is signed in as', async function() {
		await open();
		expect( ctl.emailValue.text ).to.equal("test.user@example.com");
		await waitFor(function () { return ctl.nameValue.text === "Test User"; });
		expect( ctl.nameValue.text ).to.equal("Test User");
	});

	it('draws a belt for every one earned', async function() {
		await open({ level: 3 });
		expect( ctl.beltGrid.children.length ).to.equal( 3 );
	});

	it('shows an empty grid for a trainee who has earned none', async function() {
		await open({ level: 0 });
		expect( ctl.beltGrid.children.length ).to.equal( 0 );
	});

	it('says why the grid is empty, rather than leaving a heading over nothing', async function() {
		await open({ level: 0 });
		expect( ctl.noBeltsNotice.visible ).to.equal( true );
		expect( ctl.noBeltsNotice.text ).to.contain( "No belts earned yet" );
	});

	// Merely hiding it would leave its band behind and push the first row of belts
	// down a gap it never had, so the notice gives its height and margins back
	// too — which is `present`, not `visible`.
	it('takes no room once there are belts to show instead', async function() {
		await open({ level: 3 });
		expect( ctl.noBeltsNotice.visible, "still visible" ).to.equal( false );
		expect( ctl.noBeltsNotice.height, "still tall" ).to.equal( 0 );
		expect( ctl.noBeltsNotice.top, "still pushing the grid down" ).to.equal( 0 );
	});

	// The belts are mounted after the grid has laid out, so their frames arrive
	// a pass later — poll for one rather than reading a rect that isn't there.
	async function laidOutBelts() {
		await waitFor(function () { return ctl.beltGrid.children[0].rect.width > 0; });
		return ctl.beltGrid.children;
	}

	it('lays the belts out three to a row rather than stacking them', async function() {
		await open({ level: 3 });
		var belts = await laidOutBelts();
		expect( belts[0].rect.y, "second belt shares a row with the first" ).to.equal( belts[1].rect.y );
		expect( belts[1].rect.x ).to.be.greaterThan( belts[0].rect.x );
	});

	it('wraps onto a second row once three are on the first', async function() {
		await open({ level: 4 });
		var belts = await laidOutBelts();
		expect( belts[3].rect.y, "fourth belt starts a new row" ).to.be.greaterThan( belts[0].rect.y );
	});
});
