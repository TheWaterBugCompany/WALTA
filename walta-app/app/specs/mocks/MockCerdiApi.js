function createCerdiApi( serverUrl, client_secret  ) {
    var cerdiApi = {
        retrieveUserToken() {
        },
    
        storeUserToken( accessToken ) {
           
        },
    
        obtainServerAccessToken() {
            
        },
    
        registerUser( userInfo ) {
            return Promise.reject( {
                message: "The given data was invalid",
                errors: [ { valid: ["incorrect user credentials"] } ] 
            })
        },
            
    
        loginUser( email, password ) {
            return Promise.reject( {
                message: "Unknown user"
            })
        },
    
        submitSample( sample ) {
           
        }
    
    }
    return cerdiApi;
}

exports.createCerdiApi = createCerdiApi;