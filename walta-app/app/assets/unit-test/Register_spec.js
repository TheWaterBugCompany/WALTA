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
require("unit-test/lib/ti-mocha");
var { expect } = require('unit-test/lib/chai');
var { closeWindow, controllerOpenTest, enterText, clickButton, checkTestResult } = require('unit-test/util/TestUtils');
var CerdiApi = require("unit-test/mocks/MockCerdiApi");

function setTextField( field, value ) {
    return () => { 
        return new Promise( function( resolve ) {
            enterText( field, value );
            resolve();
        });
    };
}

describe('Register controller', function() {
    var vw, ct, win;
    this.timeout(3000);

    function fillOutValidForm() {
        return Promise.resolve()
        .then( setTextField( ct.emailTextField, "test@example.com" ) )
        .then( setTextField( ct.nameTextField, "Test User") )
        .then( setTextField( ct.passwordTextField, "validPassw0rd!" ) )
        .then( setTextField( ct.passwordConfirmTextField, "validPassw0rd!" ) )
        .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    }
	before( function(done) {
        Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
        ct = Alloy.createController("Register");
        ct.groupToggle.value = true;
        ct.surveyToggle.value = true;
        ct.dataToggle.value = true;
        controllerOpenTest( ct, done );
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
    it('should enable submit if password has no upper case', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "freddytext!8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "freddytext!8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should enable submit if password has no lower case', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "FREDDYTEXT!8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "FREDDYTEXT!8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should enable submit if password has no symbol', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "fReddytext8" ) )
            .then( setTextField( ct.passwordConfirmTextField, "fReddytext8" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should enable submit if password has no number', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "fReddytext!" ) )
            .then( setTextField( ct.passwordConfirmTextField, "fReddytext!" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should disable submit if password does not equal confirm password', function() {
        return fillOutValidForm()
            .then( setTextField( ct.passwordTextField, "p0ssWord1" ) )
            .then( setTextField( ct.passwordConfirmTextField, "p0ssWord2" ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.false );
    });
    it('should call the server API if the submit button is pressed', function(done) {
        Alloy.Globals.CerdiApi.registerUser = function( userInfo ) {
            checkTestResult( done, function() {
                expect( userInfo.email ).to.equal("test@example.com");
                expect( userInfo.group ).to.be.true;
                expect( userInfo.survey_consent ).to.be.true;
                expect( userInfo.share_name_consent ).to.be.true;
                expect( userInfo.name ).to.equal("Test User");
                expect( userInfo.password ).to.equal("validPassw0rd!");
            } );
            return Promise.resolve();
        };
        fillOutValidForm()
            .then( function() {
                clickButton(ct.submitButton);
            }); 
    });
    it('should trim the email address of spaces',function() {
        return fillOutValidForm()
            .then( setTextField( ct.emailTextField, "  test@example.com  " ) )
            .then( () => expect( ct.submitButton.touchEnabled ).to.be.true );
    });
    it('should display activity indicator when waiting for the server', function() {
        var done;
        Alloy.Globals.CerdiApi.registerUser = function( userInfo ) {
            return new Promise( (resolve) => { done = resolve } );
        };
        return Promise.resolve()
            .then( () => expect( ct.activity.visible ).to.be.false )
            .then( fillOutValidForm )
            .then( () => clickButton(ct.submitButton) )
            .then( () => expect( ct.activity.visible ).to.be.true )
            .then( () => expect( ct.submitButton.visible ).to.be.false )
            .then( () => done() )
            .then( () => expect( ct.activity.visible ).to.be.false )
            .then( () => expect( ct.submitButton.visible ).to.be.true );
    });

});
