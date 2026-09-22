require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, waitFor } = require('spec/util/TestUtils');
var { makeBinder } = require("util/bindView");
var createDeleteAccount = require("mvvm/controllers/DeleteAccount");
var Topics = require("ui/Topics");

// Drives the real Delete Account modal — the Alloy presenter plus the
// Titanium-free screen controller through bindView — so the warning, the
// password field and the two buttons render on device. What the password is
// checked against is covered in Node (test/viewmodels/DeleteAccount_spec.js).
describe('DeleteAccount modal', function() {
	var mod, win, ctl, alerts, closed;

	function open({ loginFails = false } = {}) {
		return new Promise(function(resolve) {
			alerts = [];
			closed = 0;
			mod = Alloy.createController("DeleteAccount");
			win = wrapViewInWindow( mod.getView() );
			ctl = createDeleteAccount({
				view: mod,
				close: function () { closed++; },
				services: {
					topics: Topics,
					dialogs: { alert: function (opts) { alerts.push(opts); return Promise.resolve(); } },
					cerdiApi: {
						retrieveUsername: function () { return "test@example.com"; },
						loginUser: function () {
							return loginFails ? Promise.reject(new Error("401")) : Promise.resolve({});
						},
						deleteUser: function () { return Promise.resolve(); },
						storeUserToken: function () {},
					},
				},
				bindView: makeBinder(undefined, Alloy.CFG.colors)
			});
			windowOpenTest( win, resolve );
		});
	}

	afterEach( async function() {
		await closeWindow( win );
		if ( ctl ) ctl.dispose();
		mod.destroy();
	});

	it('warns that deleting the account cannot be undone', async function() {
		await open();
		expect( mod.deleteWarning.text ).to.contain("unrecoverable");
	});

	// Nothing to check a password against until one is typed, so the button
	// that destroys the account stays shut until then.
	it('keeps Delete Account disabled until a password is typed', async function() {
		await open();
		expect( mod.deleteButton.enabled ).to.equal( false );
		mod.passwordField.value = "password";
		mod.passwordField.fireEvent("change", { value: "password" });
		await waitFor(function () { return ctl.vm.deleteEnabled; });
		expect( mod.deleteButton.enabled ).to.equal( true );
	});

	it('tells the user when the password was wrong, and stays open', async function() {
		await open({ loginFails: true });
		mod.passwordField.value = "wrong";
		mod.passwordField.fireEvent("change", { value: "wrong" });
		await ctl.vm.confirmDelete();
		expect( alerts.length ).to.equal( 1 );
		expect( alerts[0].title ).to.contain("Password");
		expect( closed, "the modal stays up to try again" ).to.equal( 0 );
	});

	it('closes without deleting anything when Close is pressed', async function() {
		await open();
		mod.cancelButton.fireEvent("click");
		expect( closed ).to.equal( 1 );
	});
});
