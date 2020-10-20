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
var info = Ti.API.info;
var { loadPhoto, savePhoto } = require('util/PhotoUtils');
function createHttpClient(method, url, contentType, acceptType = 'application/json', accessToken, sendDataFunction ) {
    return new Promise( (resolve, reject) => {
        var client = Ti.Network.createHTTPClient({
                onload: function() {
                    if ( acceptType === 'application/json' ) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        resolve( this.responseData );
                    }
                
                },
                onerror: function(err) {
                    if ( this.responseText ) {
                        try {
                            reject( JSON.parse(this.responseText) );
                        } catch(err2) {
                            reject(err);
                        }
                    } else {
                        reject(err);
                    }
                },
                timeout: 30000 
            });
        client.open(method, url);
        client.setRequestHeader('Accept',acceptType) ;
        if ( contentType !== "multipart/form-data" && contentType !== null) 
            client.setRequestHeader('Content-Type', contentType);
        
        if ( accessToken ) {
            client.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        }
        sendDataFunction( client );
    });
}

function makeJsonGetRequest( serverUrl, accessToken = null) {
    //info(`get request to ${serverUrl}`);
    return createHttpClient("GET", serverUrl, null, "application/json", accessToken, 
                (client) => client.send() );
}

function makeJsonPostRequest( serverUrl, data, accessToken = null) {
    return createHttpClient("POST", serverUrl, "application/json", "application/json",accessToken, 
                (client) => client.send( JSON.stringify( data ) ) );
}

function makeImagePostRequest( serverUrl, imageData, accessToken = null ) {
    return createHttpClient("POST", serverUrl, "multipart/form-data", "application/json", accessToken, 
                (client) => client.send( { "photo": imageData } ) );
}

function makeImageGetRequest( serverUrl, accessToken = null ) {
    return createHttpClient("GET", serverUrl, null, "image/jpeg", accessToken, 
                (client) => client.send() );
}


function createCerdiApi( serverUrl, client_secret  ) {
        var cerdiApi = {
            retrieveUserToken() {
                return Ti.App.Properties.getObject('userAccessTokenLive');
            },
        
            storeUserToken( email, accessToken ) {
                Ti.App.Properties.setObject("userAccessUsername", email );
                Ti.App.Properties.setObject('userAccessTokenLive', accessToken );
            },
        
            obtainServerAccessToken() {
                return Promise.resolve(Ti.App.Properties.getObject('appAccessTokenLive'))
                    .then( (cachedAppAccessToken) => {
                        if ( cachedAppAccessToken ) {
                            let tokenAge = Date.now() - cachedAppAccessToken.retrieved_at;
                            if ( tokenAge < cachedAppAccessToken.expires_in*1000 )
                                return cachedAppAccessToken;
                        }
                        return makeJsonPostRequest( this.serverUrl + '/token/create/server',
                            {
                                "client_secret": this.client_secret,
                                "scope": this.scope
                            });
                    })
                    .then( (appAccessToken) => {
                        appAccessToken.retrieved_at = Date.now();
                        Ti.App.Properties.setObject('appAccessTokenLive', appAccessToken);
                        return appAccessToken.access_token;
                    } );
            },
        
            registerUser( userInfo ) {
                return this.obtainServerAccessToken()
                    .then( (accessToken) => 
                        makeJsonPostRequest( this.serverUrl + '/user/create', 
                            userInfo, accessToken))
                    .then( (resp) => {
                        return { id: resp.id, accessToken: resp.accessToken } ;
                    });
            },
        
            loginUser( email, password ) {
                return this.obtainServerAccessToken()
                    .then( (accessToken) =>
                        makeJsonPostRequest( this.serverUrl + '/token/create', {
                            "password": password,
                            "email": email
                        }, accessToken ) )
                    .then( (resp) => {
                        resp.retrieved_at = Date.now();
                        this.storeUserToken( email, resp );
                        
                        return resp;
                    })
            },

            submitSitePhoto( serverSampleId, photoPath ) {
                var photoBlob = loadPhoto(photoPath);
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeImagePostRequest( `${this.serverUrl}/samples/${serverSampleId}/photos`, photoBlob, accessToken );
            },

            retrieveSitePhoto( serverSampleId,photoPath ) {
                let accessToken = this.retrieveUserToken().accessToken;
                let serverUrl = this.serverUrl;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");

                function findLatestPhoto(photos) {
                    //info("find latest photos: " + JSON.stringify(photos));
                    return photos[photos.length-1];
                }

                function downloadPhoto(photo) {
                    //info("downloadPhoto photo: " + JSON.stringify(photo));
                    return makeImageGetRequest(`${serverUrl}/photos/${photo.id}/view`, accessToken);
                }

                function saveRetrievedPhoto(blob) {
                    savePhoto(blob,photoPath);
                    return photoPath;
                }
                return makeJsonGetRequest(  `${serverUrl}/samples/${serverSampleId}/photos`, accessToken )
                    .then(findLatestPhoto)
                    .then(downloadPhoto)
                    .then(saveRetrievedPhoto);

            },

            submitCreaturePhoto( serverSampleId, creatureId, photoPath ) {
                var photoBlob = loadPhoto(photoPath);
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeImagePostRequest( `${this.serverUrl}/samples/${serverSampleId}/creatures/${creatureId}/photos`, photoBlob, accessToken );
            },
        
            submitSample( sample ) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonPostRequest( this.serverUrl + '/samples', sample, accessToken );
            },

            retrieveSamples() {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonGetRequest( this.serverUrl + '/samples', accessToken );
            },

            forgotPassword( email ) {
                return this.obtainServerAccessToken()
                    .then( accessToken => makeJsonPostRequest( this.serverUrl + '/password/email', { "email": email }, accessToken ) ); 
            }
        
        }
        cerdiApi.client_secret = client_secret;
        cerdiApi.scope = 'create-users';
        cerdiApi.serverUrl = serverUrl;
        return cerdiApi;
    }

exports.createCerdiApi = createCerdiApi;