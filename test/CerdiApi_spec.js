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
require("mocha");
const sinon = require("sinon");
const { use, expect } = require("chai");
const chaiAsPromised = require("chai-as-promised");
use(chaiAsPromised);

const nock = require('nock');
const request = require('request');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const _ = require("underscore");

const Backbone = require('backbone');
const { assertLooksSame, diffImages } = require('../features/support/image-test');
const images = require('images');

const dumpReject = (err) => { console.log( JSON.stringify(err) ); throw err; };



// Mock for network testing that proxies to request library
function ProxyCreateHTTPClient( params ) {
    function isHttpError( code ) {
        let lmd = Math.trunc( code / 100 );
        return (lmd === 4) || (lmd === 5);
    }
    function prettyJson( obj ) {
        if ( obj )
            return JSON.stringify( JSON.parse( obj ), null, 4 );
        else 
            return "";
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
            //console.log(`REQUEST (${this.method}) to ${this.url}:s  data =`, data);
            let attrs = { 
                method: this.method, 
                url: this.url, 
                headers: this.headers, 
                json: false
            }
            if ( typeof(data) === "object" && this.method === "POST" && data.photo ) {
                // Assume this is the image posts and set up options value 
                // accordingly... Titanium seems to do this for us....
                attrs.formData = {
                    photo: {
                        value: data.photo,
                        options: {
                            filename: "unittest.jpg",
                            contentType: "image/jpeg"
                        }

                    }
                }; 
                
            } else {
                attrs.body = data;
            }
            //console.log("headers= ", JSON.stringify(attrs.headers));
            let rawContentChunks = [];
            request(attrs, (err,res,body) => {
                if ( err ) {
                    //console.log(`ERROR ${err}`);
                } else {
                    //console.log(`RESPONSE ${res.statusCode}: ${prettyJson(res.body)}`);
                    let rawData = Buffer.concat(rawContentChunks);
                    this.responseData = rawData;
                    this.responseText = rawData.toString("utf8");
                    if ( err || isHttpError( res.statusCode ) ) {
                        params.onerror.call( this, err );
                    } else {
                        params.onload.call( this, res );
                    }
                }
            })
            .on('error', err => params.onerror.call({}, err ) )
            .on('data', chunk => rawContentChunks.push(chunk) )
            .on('socket', socket => {
                socket.on('keylog', line => fs.appendFileSync('/tmp/secrets.log', line));
            });
        }
    }
}

function mockTi( mockCreateHTTPClient  ) {
    if ( typeof Ti === 'undefined' ) {
        global.Backbone = Backbone;
        global.Ti = { 
            API: {
                error: console.error,
                info: console.info,
                warn: console.warn,
                debug: console.debug,
            },
            Network: {
                NETWORK_NONE: 0,
                createHTTPClient: mockCreateHTTPClient      
            },
            
            App: {
                Properties: {
                    globalProperties: {},
                    clear() {
                        this.globalProperties = {};
                    },
                    setObject(name, value) { 
                       // console.log(`set ${name} = ${JSON.stringify(value)}`);
                        this.globalProperties[name] = value; 
                    },
                    getObject(name) { 
                        let value = this.globalProperties[name];
                        //console.log(`set ${name} = ${JSON.stringify(value)}`);
                        return value; 
                    },
                    hasProperty() { return false }
                }
            },

            Filesystem: {
                getFile(...paths) {
                    // Hack to detect unit test resource paths
                    if ( paths[1].startsWith("./walta-app")) {
                        paths.shift();
                    }
                    var filePath = path.join(...paths);
                    //console.log(`reading file = ${filePath}`);
                    return {
                        nativePath: filePath,
                        exists() {
                            return fs.existsSync(filePath);
                        },
                        deleteFile() {
                            fs.unlinkSync(filePath);
                            return true;
                        },
                        write(blob) {
                            fs.writeFileSync(filePath,blob);
                            return true;
                        },
                        read() {
                            let data = fs.readFileSync(filePath);
                            if ( data === undefined ) 
                                throw `Unable to read file ${filePath}`;
                           /// console.log("data = ", data);
                            return data;
                        }
                    };
                },
                resourcesDirectory: "/tmp/waterbugtest/resources",
                applicationDataDirectory: "/tmp/waterbugtest/applicationData"

            }
        };
        Ti.Network.networkType = Ti.Network.NETWORK_NONE; // stop sync just because SampleSync was loaded
        fs.mkdirSync(Ti.Filesystem.resourcesDirectory, { recursive:true } );
        fs.mkdirSync(Ti.Filesystem.applicationDataDirectory, { recursive:true } );
        
    
    } else {
        Ti.App.Properties.clear();
    }
}

function mockTiWithProxy() {
    mockTi(ProxyCreateHTTPClient);
}

mockTiWithProxy();

var CerdiApi = require("../walta-app/app/lib/logic/CerdiApi");

const { TIMEOUT } = require("dns");

var SERVER_URL = null;
var CLIENT_SECRET = null;
contents = fs.readFileSync('./walta-app/app/app-config.test.json', 'utf8');
var config = JSON.parse( contents );
SERVER_URL = config.cerdiServerUrl; //"http://office-desktop.internal:8080/v1";
CLIENT_SECRET = config.cerdiApiSecret;

if ( SERVER_URL === null || CLIENT_SECRET == null ) {
    console.log("Unable to read SERVER_URL or CLIENT_SECRET");
    process.exit(1);
}

function createTestLogin() {
    // make sure our test user is registered for tests that
    // require it.
    return CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET ).registerUser( {
        email: `testlogin@example.com`,
        group: false,
        survey_consent: false,
        share_name_consent: false,
        name: 'Test Example',
        password: 'tstPassw0rd!'
    }).catch( (err)=> {
        //Ti.API.error("Error creating test user: ", JSON.stringify(err));
    });
}

describe('CerdiApi', function() {
    
    let cerdi;
    before(function() {
        
        createTestLogin(); 
    });

    beforeEach( function() {
        
        mockTiWithProxy();
        cerdi = CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET );
    });

    describe('#obtainAccessToken', function() {
        
        it( 'should obtain access token', function() {
            expect( Ti.App.Properties.getObject('appAccessTokenLive') ).to.be.undefined;
            return cerdi.obtainServerAccessToken()
                .then( (result ) => {
                    expect( result ).to.be.a('string');
                    expect( Ti.App.Properties.getObject('appAccessTokenLive').access_token ).to.be.a('string');
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
        it( 'should fail with bad password', function() {
            return expect( cerdi.registerUser( {
                email: `test-${Date.now()}@example.com`,
                group: false,
                survey_consent: false,
                share_name_consent: false,
                name: 'Test Example',
                password: '' // empty passwords disallowed
            })).to.be.rejected;
        });

    });

    describe( '#loginUser', function() {
        
        it("should fail if a user doesn't exist",function() {
            return expect( cerdi.loginUser( 'nonexistentuser@example.com', 'badpassword' ) )
                .to.be.rejected;
        });
        it("should fail if the password doesn't match",function() {
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

    describe( '#retrieveSamples', function() {
        const sitePhotoPath = "./walta-app/app/assets/unit-test/resources/site-mock.jpg";
        const creaturePhotoPath = "./walta-app/app/assets/unit-test/resources/simpleKey1/media/amphipoda_01.jpg";
        const creaturePhotoPath2 = "./walta-app/app/assets/unit-test/resources/simpleKey1/media/amphipoda_02.jpg";
        function submitSitePhoto(serverSampleId) {
            return cerdi.submitSitePhoto(serverSampleId,sitePhotoPath)
        }
        function submitCreaturePhoto(serverSampleId,creatureId) {
            return cerdi.submitCreaturePhoto(serverSampleId,creatureId,creaturePhotoPath)
        }
        function makeTestSample(sampleDate) {
            return {
                "sample_date": sampleDate,
                "lat": "-37.5622",
                "lng": "143.87503",
                "scoring_method": "alt",
                "survey_type": "detailed",
                "waterbody_type": "wetland",
                "waterbody_name": "test water body",
                "nearby_feature": "test nearby feature",
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
                    "count": 10,
                    "photos_count": 0
                    }
                ],
            }
        }
        function submitTestSample(sampleDate) {
            return cerdi.submitSample( makeTestSample(sampleDate) );
        }
        it("should retrieve site photo", function() {
            let serverSampleId,sitePhotoId;
            function rescaleImage(filePath,width) {
                let img = fs.readFileSync(filePath);
                if ( img === undefined ) 
                        throw new Error(`Unable to read file ${filePath}`);
                return images(img).size(width).encode("png");
            }
            let siteImageRescaled = rescaleImage(sitePhotoPath,1280);
            return cerdi
                .loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
                .then( () => submitTestSample(moment().format()) )
                .then( res => serverSampleId = res.id )
                .then( () => submitSitePhoto( serverSampleId ) )
                .then( res => sitePhotoId = res.id )
                .then( () => cerdi.retrieveSitePhoto(serverSampleId,"testsitephoto.jpg"))
                .then( () => assertLooksSame(siteImageRescaled,`/tmp/waterbugtest/applicationData/testsitephoto.jpg`));
        });
        it("should retrieve creature photo", function() {
            let serverSampleId,sitePhotoId,creaturePhotoId;
            return cerdi
                .loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
                .then( () => submitTestSample(moment().format()) )
                .then( res => serverSampleId = res.id )
                .then( () => submitCreaturePhoto(serverSampleId,1) )
                .then( res => creaturePhotoId = res.id )
                .then( () => cerdi.retrieveCreaturePhoto(serverSampleId,1,"testcreaturephoto.jpg"))
                .then( () => assertLooksSame(creaturePhotoPath,`/tmp/waterbugtest/applicationData/testcreaturephoto.jpg`) );

        });

        it("should update existing sample", function(){
            let serverId = null, createdAt = null, updatedAt = null, sampleDate = moment().format(),
                sampleData = makeTestSample(sampleDate);

            function stripSample(sample) {
                delete sample.id;
                delete sample.user_id;
                _(sample.sampled_creatures).forEach( c => {
                    delete c.id;
                    delete c.sample_id;
                });
                delete sample.habitat.id;
                delete sample.habitat.sample_id;
                return sample;
            }
            return cerdi
                .loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
                .then( () => cerdi.submitSample(sampleData) )
                .then( result => {
                    serverId = result.id;
                    sampleDate = result.sample_date;
                    createdAt = result.created_at;
                    updatedAt = result.updated_at;
                })
                .then( () => cerdi.retrieveSampleById(serverId) )
                .then( result => {
                    expect(stripSample(result))
                        .deep.equal(
                        {
                            "sample_date": sampleDate,
                            "lat": "-37.5622000",
                            "lng": "143.8750300",
                            "scoring_method": "alt",
                            "created_at": createdAt,
                            "updated_at": updatedAt,
                            "survey_type": "detailed",
                            "waterbody_type": "wetland",
                            "waterbody_name": "test water body",
                            "nearby_feature": "test nearby feature",
                            "notes": "test sample",
                            "reviewed": 0,
                            "corrected": 0,
                            "complete": null,
                            "score": 0,
                            "weighted_score": null,
                            "sampled_creatures": [
                                {
                                    "creature_id": 1,
                                    "count": 10,
                                    "photos_count": 0
                                }
                            ],
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
                            "photos": []
                        }
                    ); 
                })
                .then( () => {
                    sampleData.waterbody_name = "updated water body name";
                    sampleData.creatures.push({
                        creature_id: 2,
                        count: 1,
                        photos_count: 0
                    });
                    return cerdi.updateSampleById(serverId,sampleData);
                })
                .then( () => cerdi.retrieveSampleById(serverId) )
                .then( result => {
                    updatedAt = result.updated_at;
                    expect(stripSample(result))
                        .deep.equal(
                        {
                            "sample_date": sampleDate,
                            "lat": "-37.5622000",
                            "lng": "143.8750300",
                            "scoring_method": "alt",
                            "created_at": createdAt,
                            "updated_at": updatedAt,
                            "survey_type": "detailed",
                            "waterbody_type": "wetland",
                            "waterbody_name": "updated water body name",
                            "nearby_feature": "test nearby feature",
                            "notes": "test sample",
                            "reviewed": 0,
                            "corrected": 0,
                            "complete": null,
                            "score": 0,
                            "weighted_score": null,
                            "sampled_creatures": [
                                {
                                    "creature_id": 1,
                                    "count": 10,
                                    "photos_count": 0
                                },
                                {
                                    "creature_id": 2,
                                    "count": 1,
                                    "photos_count": 0
                                }
                            ],
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
                            "photos": []
                        }
                    ); 
                })
        });
        
        it("should retrieve samples", function() {
            let createdAt = null, updatedAt = null, sampleDate = moment().format();
            return cerdi
                .loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
                .then( () => submitTestSample(sampleDate) )
                .then( result => {
                    sampleDate = result.sample_date;
                    createdAt = result.created_at;
                    updatedAt = result.updated_at;
                })
                .then( () => cerdi.retrieveSamples() )
                .then( result => {
                    expect(result).to.an("array");
                    var lastResult = result.pop();
                    delete lastResult.id;
                    delete lastResult.user_id;
                    _(lastResult.sampled_creatures).forEach( c => {
                        delete c.id;
                        delete c.sample_id;
                    });
                    delete lastResult.habitat.id;
                    delete lastResult.habitat.sample_id;
                    expect(lastResult).deep.equal(
                        {
                            "sample_date": sampleDate,
                            "lat": "-37.5622000",
                            "lng": "143.8750300",
                            "scoring_method": "alt",
                            "created_at": createdAt,
                            "updated_at": updatedAt,
                            "survey_type": "detailed",
                            "waterbody_type": "wetland",
                            "waterbody_name": "test water body",
                            "nearby_feature": "test nearby feature",
                            "notes": "test sample",
                            "reviewed": 0,
                            "corrected": 0,
                            "complete": null,
                            "score": 0,
                            "weighted_score": null,
                            "sampled_creatures": [
                                {
                                    "creature_id": 1,
                                    "count": 10,
                                    "photos_count": 0
                                }
                            ],
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
                            "photos": []
                        }
                    );
                });
        });
    });

    describe( '#forgotPassword', function() {
        it("should sucessfully send request forget password link" , function() {
            return expect( 
                cerdi.forgotPassword('michael@thecodesharman.com.au')
            ).to.eventually.have.property("success");
        });
    });
});

const SampleSync = require("../walta-app/app/lib/logic/SampleSync");

/* describe("SampleSync",function() {
    before(createTestLogin);

    beforeEach( function() {
        mockTiWithProxy();
        global.Alloy = {
            createCollection(name) {
                return Alloy.Collections[name];
            }
        }
        Alloy.Collections = {
            "sample": _.extend(Array.prototype, {
                add(item) {
                    this.push(item);
                },
                loadUploadQueue() {
                    
                }
            })
        };
        Alloy.Models = {};
        Alloy.Globals = {};
        Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( SERVER_URL, CLIENT_SECRET );
        
        return Alloy.Globals.CerdiApi.loginUser( 'testlogin@example.com', 'tstPassw0rd!' )
    });

    it("should upload samples", function() {
        Alloy.Collections["sample"]
        .add(
            _.extend({}, {
                set(field) {

                },
                get(field) {
                    return undefined;
                },
                getSitePhoto() {
                    return "something";
                },
                save() {

                },
                toCerdiApiJson() {
                    return {
                        "sample_date": moment().format(),
                        "lat": "-37.5622",
                        "lng": "143.87503",
                        "scoring_method": "alt",
                        "survey_type": "detailed",
                        "waterbody_type": "wetland",
                        "waterbody_name": "test water body",
                        "nearby_feature": "test nearby feature",
                        "creatures": [
                            {
                                "creature_id": 1,
                                "count": 10,
                                "photos_count": 1
                            }
                        ],
                        "habitat": {
                            "boulder": 5,
                            "gravel": 5,
                            "sand_or_silt": 5,
                            "leaf_packs": 5,
                            "wood": 5,
                            "aquatic_plants": 5,
                            "open_water": 5,
                            "edge_plants": 5
                        } 

                    };
                }
            })
        )
        Ti.Network.networkType = 1;
        return SampleSync.forceUpload();
    })
}); */