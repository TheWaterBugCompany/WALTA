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
                let jsonResponse = JSON.parse(this.responseText);
                if ( jsonResponse.error || jsonResponse.errors ) { 
                    if ( jsonResponse.error ) {
                        jsonResponse.errors = [ jsonResponse.error ];
                        delete jsonResponse.error;
                    }
                    Ti.API.warn( jsonResponse );
                    reject( jsonResponse );
                }
                resolve( jsonResponse );
            },
            onerror: function(err) {
                reject(err);
            },
            timeout: 30000 
        });
        client.open("POST", serverUrl);
        client.setRequestHeader('Accept', 'application/json');
        client.setRequestHeader('Content-Type', 'application/json');
        if ( accessToken ) {
            client.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        }
        client.send(data);
    });
}


export default class CerdiApi {
    constructor( serverUrl, client_secret, accessToken = null ) {
        this.client_secret = client_secret;
        this.scope = 'create-users';
        this.serverUrl = serverUrl;
        this.cachedAppAccessToken = accessToken;
    }

    obtainAccessToken() {
        return Promise.resolve(this.cachedAppAccessToken)
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
                this.cachedAppAccessToken = appAccessToken;
                this.cachedAppAccessToken.retrieved_at = Date.now();
                return this.cachedAppAccessToken.access_token;
            } );
    }

    registerUser( userInfo ) {
        if ( typeof( userInfo.password ) !== 'undefined' ) {
            return this.obtainAccessToken()
                .then( (accessToken) => 
                    makeJsonRequest( this.serverUrl + '/user/create', 
                        userInfo, accessToken))
                .then( (resp) => {
                    return { id: resp.id, accessToken: resp.accessToken } ;
                });
        }
    }


}