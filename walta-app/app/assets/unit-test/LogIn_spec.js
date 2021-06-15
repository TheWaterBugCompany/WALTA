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
var simple = require("unit-test/lib/simple-mock");
var Topics = require('ui/Topics');
var { expect } = require('unit-test/lib/chai');
var { closeWindow, controllerOpenTest, enterText, clickButton, checkTestResult, waitForTick } = require('unit-test/util/TestUtils');
var CerdiApi = require("unit-test/mocks/MockCerdiApi");

describe.only('LogIn controller', function() {
	var login;
	beforeEach( function() {
        Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
		login = Alloy.createController( "LogIn" );
	});

	afterEach( function(done) {
		closeWindow( login.getView(), done );
	});
	
	it('it should render', function(done) {
		controllerOpenTest( login, done );
    });
    
    it('it should send a login request to Cerdi Api', function(done) {
        Alloy.Globals.CerdiApi.loginUser = function( email, password ) {
            checkTestResult( done, function() {
                expect( email ).to.equal("test@example.com");
                expect( password ).to.equal("password");
            });
            return Promise.resolve();
        }
        expect( login.logInButton.enabled ).to.be.false;
		controllerOpenTest( login, function() {
            enterText( login.emailTextField, "test@example.com" );
            enterText( login.passwordTextField, "password" );
            setTimeout( function() {
                expect( login.logInButton.enabled ).to.be.true;
                clickButton( login.logInButton );
            }, 10)
            
        } );
    });
    
    it.only('it should send a change password request to Cerdi Api', async function() {
        simple.mock(Alloy.Globals.CerdiApi,"forgotPassword").resolveWith();
        expect( login.forgotPasswordButton.enabled, "reset password should be disabled" ).to.be.false;
		await controllerOpenTest( login );
        enterText( login.emailTextField, "test@example.com" );
        enterText( login.passwordTextField, "" );
        await waitForTick(10)();
        expect( login.forgotPasswordButton.enabled, "reset password should be enabled" ).to.be.true;
        clickButton( login.forgotPasswordButton );
        await waitForTick(10)();
        expect(Alloy.Globals.CerdiApi.forgotPassword.callCount).to.equal(1);
        expect(Alloy.Globals.CerdiApi.forgotPassword.calls[0].args[0]).to.contain("test@example.com");
    });
    
    it('should fire LOGGEDIN event when login is a success', function(done) {
        Alloy.Globals.CerdiApi.loginUser = function( email, password ) { 
            return Promise.resolve(); 
        }
        Topics.subscribe( Topics.LOGGEDIN, _.once( done ) );
        controllerOpenTest( login, function() {
            enterText( login.emailTextField, "  test@example.com  " );
            enterText( login.passwordTextField, "password" );
            clickButton( login.logInButton );
        } );
    });
 
    it('should indicate missing password', function(done) {
        controllerOpenTest( login, () => checkTestResult( done, function() {
            enterText( login.emailTextField, "test@example.com" );
            enterText( login.passwordTextField, "password" );
            expect( login.logInButton.touchEnabled ).to.be.true;
            enterText( login.passwordTextField, "" );
            expect( login.logInButton.touchEnabled ).to.be.false;
            expect( login.passwordTextField.borderColor ).to.equal("red");
        }) );
    });
 
    it('should indicate invalid email', function(done) {
        controllerOpenTest( login, () => checkTestResult( done,  function() {
            enterText( login.emailTextField, "test@example.com" );
            enterText( login.passwordTextField, "password" );
            expect( login.logInButton.touchEnabled ).to.be.true;
            enterText( login.emailTextField, "notvalidemail" );
            expect( login.logInButton.touchEnabled ).to.be.false;
            expect( login.emailTextField.borderColor ).to.equal("red");
        }));
    }); 

    it('should trim spaces from email', function(done) {
        Alloy.Globals.CerdiApi.loginUser = function( email, password ) {
            checkTestResult( done, function() {
                expect( email ).to.equal("test@example.com");
            });
            return Promise.resolve(); 
        }
        controllerOpenTest( login, function() {
            enterText( login.emailTextField, "  test@example.com  " );
            enterText( login.passwordTextField, "password" );
            clickButton( login.logInButton );
        } );
    });

    it('should display activity indicator when waiting for the server', function(done) {
        var doneLogin;
        Alloy.Globals.CerdiApi.loginUser = function( userInfo ) {
            return new Promise( (resolve) => { doneLogin = resolve } );
        };
        controllerOpenTest( login, () => checkTestResult( done,  function() {
            expect( login.activity.visible ).to.be.false;
            expect( login.logInButton.visible ).to.be.true;
            enterText( login.emailTextField, "test@example.com" );
            enterText( login.passwordTextField, "password" );
            clickButton( login.logInButton );
            setTimeout( () => {
                expect( login.activity.visible ).to.be.true;
                expect( login.logInButton.visible ).to.be.false;
                doneLogin();
                setTimeout( () => {
                    expect( login.activity.visible ).to.be.false;
                    expect( login.logInButton.visible ).to.be.true;
                }, 50);
            }, 50);
        } ));
    });
});
