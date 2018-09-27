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
var { closeWindow, controllerOpenTest } = require('specs/util/TestUtils');

function setTextField( field, value ) {
    return () => { 
        return new Promise( function( resolve ) {
            field.value = value;
            field.fireEvent("change");
            resolve();
        });
    };
}

describe('Register controller', function() {
    var vw, ct, win;
    this.timeout(3000);

    function fillOutValidForm() {
        return Promise.resolve()
        .then( setTextField( ct.emailTextField, "example@test.com.au" ) )
        .then( setTextField( ct.nameTextField, "Test User") )
        .then( setTextField( ct.passwordTextField, "validPassw0rd!" ) )
        .then( setTextField( ct.passwordConfirmTextField, "validPassw0rd!" ) )
        .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    }
	before( function(done) {
        ct = Alloy.createController("Register");
        controllerOpenTest( ct, done );
        ct.groupToggle.value = true;
        ct.surveyToggle.value = true;
        ct.dataToggle.value = true;
        
	});
	after( function() {
		closeWindow( ct.getView() );
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
    it('should enable submit if password is valid', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "validPassw0rd!" ) )
            .then( setTextField( ct.passwordConfirmTextField, "validPassw0rd!" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should disable submit if password is too short', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "sM8!l" ) )
            .then( setTextField( ct.passwordConfirmTextField, "sM8!l" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password has no upper case', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "freddytext!8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "freddytext!8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password has no lower case', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "FREDDYTEXT!8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "FREDDYTEXT!8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password has no symbol', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "fReddytext8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "fReddytext8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password has no number', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "fReddytext!" ) )
            .then( setTextField( ct.passwordConfirmTextField, "fReddytext!" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should disable submit if password does not equal confirm password', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "p0ssWord1" ) )
            .then( setTextField( ct.passwordConfirmTextField, "p0ssWord2" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should call the serve API if the submit button is pressed', function() {
        return fillOutValidForm();
    });

});
