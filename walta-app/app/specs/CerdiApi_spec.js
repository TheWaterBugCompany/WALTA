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
const { use, expect } = require('specs/lib/chai');
const chaiAsPromised = require("chai-as-promised");

const nock = require('nock');
const request = require('request');
const fs = require('fs');
const moment = require('moment');

const dumpReject = (err) => { console.log( JSON.stringify(err) ); throw err; };

use(chaiAsPromised);

// Mock for network testing that proxies to request library
function ProxyCreateHTTPClient( params ) {
    function isHttpError( code ) {
        let lmd = Math.trunc( code / 100 );
        return (lmd === 4) || (lmd === 5);
    }
    function prettyJson( obj ) {
        return JSON.stringify( JSON.parse( obj ), null, 4 );
    }
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
            console.log(`REQUEST: ${prettyJson(data)}`);
            request({ 
                method: this.method, 
                url: this.url, 
                headers: this.headers, 
                json: false,
                body: data
            }, 
            (err,res,body) => {
                console.log(`RESPONSE ${res.statusCode}: ${prettyJson(res.body)}`);
                this.responseText = body;
                if ( err || isHttpError( res.statusCode ) ) {
                    params.onerror.call( this, err );
                } else {
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
                error: console.error,
                info: console.info,
                warn: console.warn
            },
            Network: {
                createHTTPClient: mockCreateHTTPClient      
            },
            App: {
                Properties: {
                    globalProperties: {},
                    clear() {
                        this.globalProperties = {};
                    },
                    setObject(name, value) { 
                        this.globalProperties[name] = value; 
                    },
                    getObject(name) { 
                        return this.globalProperties[name]; 
                    },
                    hasProperty() { return false }
                }
            }
        };
    } else {
        Ti.App.Properties.clear();
    }
}

function mockTiWithProxy() {
    mockTi(ProxyCreateHTTPClient);
}


var CerdiApi = require("logic/CerdiApi");

var SERVER_URL = 'https://api-wbb.till.cerdi.edu.au/v1';
var CLIENT_SECRET = null;
fs.readFile('./walta-app/app/config.json', 'utf8', function(err,contents) {
    if ( err ) {
        throw err;
    }
    CLIENT_SECRET = JSON.parse( contents )["env:production"].cerdiApiSecret;
});
describe('CerdiApi', function() {
    let cerdi;
    before( function() {
        // make sure our test user is registered for tests that
        // require it.
        mockTiWithProxy();
        return CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET ).registerUser( {
            email: `testlogin@example.com`,
            group: false,
            survey_consent: false,
            share_name_consent: false,
            name: 'Test Example',
            password: 'tstPassw0rd!'
        }).catch( (err)=> {
            // Ignore failures
        });
    });

    beforeEach( function() {
        mockTiWithProxy();
        cerdi = CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET );
    });

    describe('#obtainAccessToken', function() {
        
        it( 'should obtain access token', function() {
            expect( Ti.App.Properties.getObject('appAccessToken') ).to.be.undefined;
            return cerdi.obtainServerAccessToken()
                .then( (result ) => {
                    expect( result ).to.be.a('string');
                    expect( Ti.App.Properties.getObject('appAccessToken').access_token ).to.be.a('string');
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
                return expect( cerdi.obtainServerAccessToken() ).to.eventually.equal( "testtoken 1")
                    .then( () => expect( cerdi.obtainServerAccessToken() ).to.eventually.equal( "testtoken 1") );
            });

            it( 'should renew the value after it has expired', function() {
                return expect( cerdi.obtainServerAccessToken() ).to.eventually.equal( "testtoken 1")
                    .then( () => {
                        clock.tick(1000);
                        return expect( cerdi.obtainServerAccessToken() ).to.eventually.equal( "testtoken 2");
                     } );
            });
        });


    });

    describe('#registerUser', function() {
        it( 'should succesfully register a local user', function() {
            return expect( cerdi.registerUser( {
                email: `test-${Date.now()}@example.com`,
                group: false,
                survey_consent: false,
                share_name_consent: false,
                name: 'Test Example',
                password: 'tstPassw0rd!'
            })).to.eventually.have.property("accessToken").to.be.a('string');
        });
        it.only( 'should fail with bad password', function() {
            return expect( cerdi.registerUser( {
                email: `test-${Date.now()}@example.com`,
                group: false,
                survey_consent: false,
                share_name_consent: false,
                name: 'Test Example',
                password: 'badpassword'
            })).to.be.rejected;
        });
        it( 'should succesfully register a social user' );

    });

    describe( '#loginUser', function() {
        
        it.only("should fail if a user doesn't exist",function() {
            return expect( cerdi.loginUser( 'nonexistentuser@example.com', 'badpassword' ) )
                .to.be.rejected;
        });
        it.only("should fail if the password doesn't match",function() {
            return expect( cerdi.loginUser( 'testlogin@example.com', 'badpassword' ) )
                .to.be.rejected;
        });
        it("should log in an existing user",function() {
            return expect( cerdi.loginUser( 'testlogin@example.com', 'tstPassw0rd!' ) )
                .to.eventually.have.property("accessToken").and.to.be.a('string')
                .then( () => expect(cerdi.retrieveUserToken()).have.property("accessToken").and.to.be.a('string') );
        });
    });

    describe( '#submitSample', function() {
        it("should submit a sample", function() {
            return expect( 
                cerdi
                    .loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
                    .then( ()=> cerdi.submitSample( {
                                "sample_date": `${moment().format()}`,
                                "lat": "-37.5622",
                                "lng": "143.87503",
                                "scoring_method": "alt",
                                "survey_type": "detailed",
                                "waterbody_type": "river",
                                "waterbody_name": "string",
                                "nearby_feature": "string",
                                "notes": "test sample",
                                "habitat": {
                                "boulder": 5,
                                "gravel": 5,
                                "sand_or_silt": 5,
                                "leaf_packs": 5,
                                "wood": 5,
                                "aquatic_plants": 5,
                                "open_water": 5,
                                "edge_plants": 5
                                },
                                "creatures": [
                                    {
                                    "creature_id": 1,
                                    "count": 2,
                                    "photos_count": 0
                                    }
                                ],
                            }))
            ).to.eventually.have.property("id");
        });
    });
});