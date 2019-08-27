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
var Topics = require('ui/Topics');
var { expect } = require('unit-test/lib/chai');
var { closeWindow, controllerOpenTest, enterText, clickButton, checkTestResult } = require('unit-test/util/TestUtils');
var CerdiApi = require("unit-test/mocks/MockCerdiApi");

describe('LogIn controller', function() {
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
    
    it('it should send a change password request to Cerdi Api', function(done) {
        Alloy.Globals.CerdiApi.forgotPassword = function( email ) {
            checkTestResult( done, function() {
                expect( email ).to.equal("test@example.com");
            });
            return Promise.resolve();
        }
        expect( login.forgotPasswordButton.enabled, "reset password should be disabled" ).to.be.false;
		controllerOpenTest( login, function() {
            enterText( login.emailTextField, "test@example.com" );
            enterText( login.passwordTextField, "" );
            setTimeout( function() {
                expect( login.forgotPasswordButton.enabled, "reset password should be enabled" ).to.be.true;
                clickButton( login.forgotPasswordButton );
            }, 10)
        } );
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

    it('should indicate invalid email');
    it('should indicate missing password');

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
});