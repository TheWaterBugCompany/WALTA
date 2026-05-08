const Logger = require('util/Logger');
const log = (m, tag = "auth") => Logger.log(m, tag);
const trace = (m) => Logger.log(m, "network");
var { loadPhoto, savePhoto } = require('util/PhotoUtils');

const SENSITIVE_KEYS = ["password", "client_secret", "accessToken", "access_token"];
function redactBody(data) {
    if (!data || typeof data !== 'object') return data;
    const copy = Array.isArray(data) ? data.slice() : Object.assign({}, data);
    for (const k of SENSITIVE_KEYS) {
        if (k in copy) copy[k] = "[REDACTED]";
    }
    return copy;
}
function createHttpClient(method, url, contentType, acceptType = 'application/json', accessToken, sendDataFunction ) {
    return new Promise( (resolve, reject) => {
        var client = Ti.Network.createHTTPClient({
                onload: function() {
                    if ( acceptType === 'application/json' ) {
                        const parsed = JSON.parse(this.responseText);
                        trace(`<- ${this.status} ${method} ${url} ${JSON.stringify(redactBody(parsed))}`);
                        resolve(parsed);
                    } else {
                        const bytes = this.responseData ? this.responseData.length : 0;
                        trace(`<- ${this.status} ${method} ${url} (${bytes} bytes)`);
                        resolve( this.responseData );
                    }
                },
                onerror: function(err) {
                    const status = this.status || '?';
                    if ( this.responseText ) {
                        try {
                            const parsed = JSON.parse(this.responseText);
                            trace(`<- ${status} ${method} ${url} ERROR ${JSON.stringify(redactBody(parsed))}`);
                            reject( parsed );
                        } catch(err2) {
                            trace(`<- ${status} ${method} ${url} ERROR ${this.responseText}`);
                            reject(err);
                        }
                    } else {
                        trace(`<- ${status} ${method} ${url} ERROR (no body)`);
                        reject(err);
                    }
                }
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
    trace(`GET ${serverUrl}`);
    return createHttpClient("GET", serverUrl, null, "application/json", accessToken,
                (client) => client.send() );
}

function makeJsonDeleteRequest( serverUrl, accessToken = null) {
    trace(`DELETE ${serverUrl}`);
    return createHttpClient("DELETE", serverUrl, null, "application/json", accessToken,
                (client) => client.send() );
}

function makeJsonPostRequest( serverUrl, data, accessToken = null) {
    trace(`POST ${serverUrl} ${JSON.stringify(redactBody(data))}`);
    return createHttpClient("POST", serverUrl, "application/json", "application/json",accessToken,
                (client) => client.send( JSON.stringify( data ) ) );
}

function makeJsonPutRequest( serverUrl, data, accessToken = null) {
    trace(`PUT ${serverUrl} ${JSON.stringify(redactBody(data))}`);
    return createHttpClient("PUT", serverUrl, "application/json", "application/json",accessToken,
                (client) => client.send( JSON.stringify( data ) ) );
}

function makeImagePostRequest( serverUrl, imageData, data, accessToken = null ) {
    data.photo = imageData;
    trace(`POST ${serverUrl} (multipart, ${Object.keys(data).join(",")})`);
    return createHttpClient("POST", serverUrl, "multipart/form-data", "application/json", accessToken,
                (client) => client.send( data ) );
}

function makeImagePutRequest( serverUrl, imageData, data, accessToken = null ) {
    data.photo = imageData;
    trace(`PUT ${serverUrl} (multipart, ${Object.keys(data).join(",")})`);
    return createHttpClient("PUT", serverUrl, "multipart/form-data", "application/json", accessToken,
                (client) => client.send( data ) );
}

function makeImageGetRequest( serverUrl, accessToken = null ) {
    trace(`GET ${serverUrl} (image)`);
    return createHttpClient("GET", serverUrl, null, "image/jpeg", accessToken,
                (client) => client.send() );
}

function retrievePhoto(photoId,serverUrl,accessToken,photoPath) {
    function saveRetrievedPhoto(blob) {
        savePhoto(blob,photoPath);
        return { id: photoId, photoPath: photoPath};
    }
    return makeImageGetRequest(`${serverUrl}/photos/${photoId}/view`, accessToken)
        .then(saveRetrievedPhoto);
}

function retrievePhotoFromMeta( serverUrl, photoUrl, accessToken, photoPath ) {
    function findLatestPhoto(photos) {
        //info("find latest photos: " + JSON.stringify(photos));
        return photos[photos.length-1];
    }
    function downloadPhoto(photo) {
        //info("downloadPhoto photo: " + JSON.stringify(photo));
        return retrievePhoto(photo.id,serverUrl,accessToken,photoPath)
    }
   
    function downloadPhotoIfExists(photos) {
        if ( photos.length > 0 ) {
            let photo = findLatestPhoto(photos);
            return downloadPhoto(photo)
                .then( () => photo ); // return the id so the caller can save it
        }
    }
    let photoMeta = null;
    return makeJsonGetRequest(`${serverUrl}/${photoUrl}`, accessToken )
        .then( downloadPhotoIfExists );
        
}




function createCerdiApi( serverUrl, client_secret  ) {
        log(`Using CERDI API server ${serverUrl}` );
        var cerdiApi = {
            retrieveUserToken() {
                return Ti.App.Properties.getObject('userAccessTokenLive');
            },

            retrieveUserId() {
                let token = this.retrieveUserToken();
                if ( token ) {
                    return token.id;
                }
            },
        
            storeUserToken( email, accessToken ) {
                //Ti.API.info(`accessToken = ${JSON.stringify(accessToken)}`)
                Ti.App.Properties.setObject("userAccessUsername", email );
                Ti.App.Properties.setObject('userAccessTokenLive', accessToken );
            },
        
            obtainServerAccessToken() {
                return Promise.resolve(Ti.App.Properties.getObject('appAccessTokenLive'))
                    .then( (cachedAppAccessToken) => {
                        if ( cachedAppAccessToken ) {
                            log(`Got existing access token retrieved_at = ${cachedAppAccessToken.retrieved_at} expires_in = ${cachedAppAccessToken.expires_in}`);
                            let tokenAge = Date.now() - cachedAppAccessToken.retrieved_at;
                            if ( tokenAge < cachedAppAccessToken.expires_in*1000 )
                                return cachedAppAccessToken;
                            log("Expired token"); 
                        } 
                        
                        log("Requesting a new token");
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
                return makeImagePostRequest( `${this.serverUrl}/samples/${serverSampleId}/photos`, photoBlob, {}, accessToken );
            },

            submitCreaturePhoto( serverSampleId, creatureId, photoPath ) {
                var photoBlob = loadPhoto(photoPath);
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeImagePostRequest( `${this.serverUrl}/samples/${serverSampleId}/creatures/${creatureId}/photos`, photoBlob, {}, accessToken );
            },

            retrievePhoto(photoId,photoPath) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return retrievePhoto(photoId,this.serverUrl,accessToken,photoPath)
            },

            retrievePhotoMetadata(photoId) {
                let accessToken = this.retrieveUserToken().accessToken;
                return makeJsonGetRequest(`${this.serverUrl}/photos/${photoId}`, accessToken )
            },

            retrieveSitePhoto( serverSampleId,photoPath ) {
                let accessToken = this.retrieveUserToken().accessToken;
                let serverUrl = this.serverUrl;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return retrievePhotoFromMeta(serverUrl,`samples/${serverSampleId}/photos`, 
                            accessToken, photoPath);

            },

            retrieveCreaturePhoto( serverSampleId,creatureId,photoPath ) {
                let accessToken = this.retrieveUserToken().accessToken;
                let serverUrl = this.serverUrl;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return retrievePhotoFromMeta(serverUrl,`samples/${serverSampleId}/creatures/${creatureId}/photos`,
                            accessToken, photoPath);
            },

            submitSample( sample ) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonPostRequest( this.serverUrl + '/samples', sample, accessToken );
            },

            retrieveSampleById(serverSampleId) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonGetRequest( `${this.serverUrl}/samples/${serverSampleId}`, accessToken );
            },

            updateSampleById(serverSampleId,sample) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonPutRequest( `${this.serverUrl}/samples/${serverSampleId}`, sample, accessToken );
            },
            
            updateUnknownCreature(unknownCreatureId,count,photoPath) {
                var photoBlob = loadPhoto(photoPath);
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeImagePutRequest( `${this.serverUrl}/unknownSampledCreatures/${unknownCreatureId}`, photoBlob, { count: count }, accessToken );
        
            },

            submitUnknownCreature(serverSampleId,count,photoPath) {
                var photoBlob = loadPhoto(photoPath);
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeImagePostRequest( `${this.serverUrl}/samples/${serverSampleId}/unknownCreatures`, photoBlob, { count: count }, accessToken );
            },

            deleteUnknownCreature(unknownCreatureId) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonDeleteRequest( `${this.serverUrl}/unknownSampledCreatures/${unknownCreatureId}`, accessToken );
            
            },

            retrieveUnknownCreatures(serverSampleId) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonGetRequest( `${this.serverUrl}/samples/${serverSampleId}/unknownCreatures`, accessToken );
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