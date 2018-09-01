/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("specs/lib/ti-mocha");
var { expect } = require('specs/lib/chai');
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, waitForTick } = require('specs/util/TestUtils');
var Topics = require('ui/Topics');
setManualTests(true);

function setTextField( field, value ) {
    return () => { 
        return new Promise( function( resolve ) {
            field.value = value;
            field.fireEvent("change");
            resolve();
        });
    };
}


describe.only('RegisterView', function() {
    var vw, ct, win;
    this.timeout(3000);

    function fillOutValidForm() {
        return Promise.resolve()
        .then( setTextField( ct.emailTextField, "example@test.com.au" ) )
        .then( setTextField( ct.nameTextField, "Test User") )
        .then( setTextField( ct.passwordTextField, "validPassword" ) )
        .then( setTextField( ct.passwordConfirmTextField, "validPassword" ) )
        .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    }
	before( function(done) {
        ct = Alloy.createController("Register");
        vw = ct.getView();
        win = wrapViewInWindow(vw);
        windowOpenTest( win, done );
        ct.groupToggle.value = true;
        ct.surveyToggle.value = true;
        ct.dataToggle.value = true;
        
	});
	after( function() {
		closeWindow( win );
	});
	it('should display the register view', function(done) {
		
		done();
    });
    
    it('should disable submit if email is invalid', function() {
        return fillOutValidForm()
            .then( setTextField( ct.emailTextField, "notanemailaddress" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if name is blank', function() {
        return fillOutValidForm()
            .then( setTextField( ct.nameTextField, "" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password doesnt meet complexity requirements', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "small" ) )
            .then( setTextField( ct.passwordConfirmTextField, "small" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password doesnt equal confirm password', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "password1" ) )
            .then( setTextField( ct.passwordConfirmTextField, "password2" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should call the serve API if the submit button is pressed');

});
