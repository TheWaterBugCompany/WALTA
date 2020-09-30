function createCerdiApi( serverUrl, client_secret  ) {
    var cerdiApi = {
        retrieveUserToken() {
        },
    
        storeUserToken( accessToken ) {
           
        },
    
        obtainServerAccessToken() {
            
        },
    
        retrieveUserToken() {
            return "token"; 
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
           
        },

        submitCreaturePhoto(sampleId, taxonId, photo ) {
            this.photosSubmitted.push(photo);
            return Promise.resolve();
        },
        photosSubmitted: [],
        sampleData: [],
        submitSitePhoto(serverSampleId, photoPath ) {
            this.photosSubmitted.push(photoPath);
            return Promise.resolve();
        },

        retrieveSamples() {
            return Promise.resolve(this.sampleData);
        },

        forgotPassword( email ) {
            
        }
    
    }
    return cerdiApi;
}

exports.createCerdiApi = createCerdiApi;