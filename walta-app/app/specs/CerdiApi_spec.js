/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 Copyright (C) 2014 The Waterbug Company

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
require("specs/lib/mocha");
const sinon = require("sinon");
const { expect } = require('specs/lib/chai');
const nock = require('nock');
const request = require('request');

// Mock for network testing that proxies to request library

function ProxyCreateHTTPClient( params ) {
    return {
        onload: params.onload,
        onerror: params.onerror,
        timeout: (params.timeout ? params.timeout : 5000 ),
        headers: {},
        setRequestHeader( name, value ) {
            this.headers[name] = value;
        },
        open( method, url ) {
            this.url = url;
            this.method = method;
        },
        send( data ) {
            request({ 
                method: this.method, 
                url: this.url, 
                headers: this.headers, 
                json: false,
                body: JSON.stringify(data)
            }, 
            (err,res,body) => {
                if ( err ) {
                    params.onerror.call( this, err );
                } else {
                    this.responseText = body;
                    params.onload.call( this, res );
                }
            });
        }
    }
}

function mockTi( mockCreateHTTPClient  ) {
    if ( typeof Ti === 'undefined' ) {

        global.Ti = { 
            API: {
                info: console.info,
                warn: console.warn
            },
            Network: {
                createHTTPClient: mockCreateHTTPClient      
            }
        };
    }
}

function mockTiWithProxy() {
    mockTi(ProxyCreateHTTPClient);
}


import CerdiApi from 'logic/CerdiApi';

var SERVER_URL = 'https://api-wbb.till.cerdi.edu.au/v1';
var CLIENT_SECRET = '<<TODO READ SECRET FROM config FILE somehow';
describe('CerdiApi', function() {
    let cerdi;

    beforeEach( function() {
        mockTiWithProxy();
        cerdi = new CerdiApi( SERVER_URL, CLIENT_SECRET );
    });

    describe('#obtainAccessToken', function() {
        
        it( 'should obtain access token', function() {
            expect( cerdi.cachedAppAccessToken ).to.be.null;
            return cerdi.obtainAccessToken()
                .then( (result ) => {
                    expect( result ).to.be.a('string');
                    expect( cerdi.cachedAppAccessToken.access_token ).to.be.a('string');
                });
        });

        describe('token expiration', function() {
            let clock;
            beforeEach( function() {
                clock = sinon.useFakeTimers( { now: 12345678 });
                nock(SERVER_URL)
                    .post( '/token/create/server')
                    .reply( 200, {
                        expires_in: 1,
                        access_token: "testtoken 1"
                    })
                    .post( '/token/create/server')
                    .reply( 200, {
                        expires_in: 1,
                        access_token: "testtoken 2" 
                    });
            });
            
            afterEach( function() {
                clock.restore();
                nock.cleanAll();
            });

            it( 'should cache the previous value', function() {
                return cerdi.obtainAccessToken()
                    .then( (token) => expect( token ).to.equal( "testtoken 1") )
                    .then( () => cerdi.obtainAccessToken() )
                    .then( (token) => expect( token ).to.equal( "testtoken 1") );
            });

            it( 'should renew the value after it has expired', function() {
                return cerdi.obtainAccessToken()
                    .then( (token) => expect( token ).to.equal( "testtoken 1") )
                    .then( () => {
                        clock.tick(1000);
                        return cerdi.obtainAccessToken();
                     } )
                    .then( (token) => expect( token ).to.equal( "testtoken 2") );
            });
        });


    });

    describe('#registerUser', function() {
        it( 'should succesfully register a local user', function() {
            return cerdi.registerUser( {
                email: `test-${Date.now()}@example.com`,
                group: false,
                survey_consent: false,
                share_name_consent: false,
                name: 'Test Example',
                password: 'tstPassw0rd!'
            })
            .then( (response) => {
                expect( response.accessToken ).to.be.a('string');
                expect( response.id ).to.be.a('number');
            });
        });
        it( 'should succesfully register a social user' );

    });
});