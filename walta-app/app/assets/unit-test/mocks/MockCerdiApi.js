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

        submitCreaturePhoto(sampleId, taxonId, photoPath ) {
            var photoId = `s${sampleId}_t${taxonId}_creature`;
            this.photosSubmitted[photoId] = photoPath;
            return Promise.resolve(photoId);
        },
        photosSubmitted: [],
        sampleData: [],
        submitSitePhoto(sampleId, photoPath ) {
            var photoId = `s${sampleId}_site`
            this.photosSubmitted[photoId] = photoPath;
            return Promise.resolve(photoId);
        },

        retrieveSamples() {
            return Promise.resolve(this.sampleData);
        },

        retrievePhoto(sampleId,) {
            return photos[`id_${id}`];
        },

        forgotPassword( email ) {
            
        }
    
    }
    return cerdiApi;
}

exports.createCerdiApi = createCerdiApi;