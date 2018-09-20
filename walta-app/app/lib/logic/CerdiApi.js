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

function makeJsonRequest( serverUrl, data, accessToken = null ) {
    return new Promise( (resolve, reject) => {
        var client = Ti.Network.createHTTPClient({
            onload: function() {
                resolve( JSON.parse(this.responseText) );
            },
            onerror: function(err) {
                if ( this.responseText ) {
                    try {
                        reject( JSON.parse(this.responseText) );
                    } catch(err) {
                        reject( this.responseText)
                    }
                } else {
                    reject(err);
                }
            },
            timeout: 30000 
        });
        client.open("POST", serverUrl);
        client.setRequestHeader('Accept', 'application/json');
        client.setRequestHeader('Content-Type', 'application/json');
        if ( accessToken ) {
            client.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        }
        client.send( JSON.stringify( data ) );
    });
}


function createCerdiApi( serverUrl, client_secret  ) {
        var cerdiApi = {
            retrieveUserToken() {
                return Ti.App.Properties.getObject('userAccessToken');
            },
        
            storeUserToken( accessToken ) {
                Ti.App.Properties.setObject('userAccessToken', accessToken );
            },
        
            obtainServerAccessToken() {
                return Promise.resolve(Ti.App.Properties.getObject('appAccessToken'))
                    .then( (cachedAppAccessToken) => {
                        if ( cachedAppAccessToken ) {
                            let tokenAge = Date.now() - cachedAppAccessToken.retrieved_at;
                            if ( tokenAge < cachedAppAccessToken.expires_in*1000 )
                                return cachedAppAccessToken;
                        }
                        return makeJsonRequest( this.serverUrl + '/token/create/server',
                            {
                                "client_secret": this.client_secret,
                                "scope": this.scope
                            });
                    })
                    .then( (appAccessToken) => {
                        appAccessToken.retrieved_at = Date.now();
                        Ti.App.Properties.setObject('appAccessToken', appAccessToken);
                        return appAccessToken.access_token;
                    } );
            },
        
            registerUser( userInfo ) {
                return this.obtainServerAccessToken()
                    .then( (accessToken) => 
                        makeJsonRequest( this.serverUrl + '/user/create', 
                            userInfo, accessToken))
                    .then( (resp) => {
                        return { id: resp.id, accessToken: resp.accessToken } ;
                    });
            },
        
            loginUser( email, password ) {
                return this.obtainServerAccessToken()
                    .then( (accessToken) =>
                         makeJsonRequest( this.serverUrl + '/token/create', {
                            "password": password,
                            "email": email
                        }, accessToken ) )
                    .then( (resp) => {
                        resp.retrieved_at = Date.now();
                        this.storeUserToken( resp );
                        return resp;
                    })
            },
        
            submitSample( sample ) {
                let accessToken = this.retrieveUserToken().accessToken;
                if ( accessToken == undefined )
                    throw new Error("Not logged in - cannot submit sample");
                return makeJsonRequest( this.serverUrl + '/samples', sample, accessToken );
            }
        
        }
        cerdiApi.client_secret = client_secret;
        cerdiApi.scope = 'create-users';
        cerdiApi.serverUrl = serverUrl;
        return cerdiApi;
    }

exports.createCerdiApi = createCerdiApi;