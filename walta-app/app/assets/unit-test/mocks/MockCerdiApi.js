var simple = require("unit-test/lib/simple-mock");
function createCerdiApi( serverUrl, client_secret  ) {
    var cerdiApi = {};

   /*     storeUserToken( accessToken ) {
           
        },
    
        obtainServerAccessToken() {
            return Promise.resolve("token");
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
           return Promise.resolve();
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

        retrievePhotoMetadata(photoId) {
            return Promise.resolve();
        },

        retrieveSitePhoto(serverSampleId,photoPath) {
            return Promise.resolve();
        },

        retrieveCreaturePhoto( serverSampleId,creatureId,photoPath ) {
            return Promise.resolve();
        },

        forgotPassword( email ) {
            
        }
    
    }*/
    simple.mock(cerdiApi,"storeUserToken")
        .resolveWith();
    simple.mock(cerdiApi,"obtainServerAccessToken")
        .resolveWith("token");
    simple.mock(cerdiApi,"retrieveUserToken")
        .resolveWith("token");
    simple.mock(cerdiApi,"registerUser")
        .rejectWith({
            message: "The given data was invalid",
            errors: [ { valid: ["incorrect user credentials"] } ] 
        });
    simple.mock(cerdiApi,"loginUser")
        .rejectWith({
            message: "Unknown user"
        });
    simple.mock(cerdiApi,"submitSample").resolveWith();
    simple.mock(cerdiApi,"retrieveSamples").resolveWith();
    simple.mock(cerdiApi,"submitSitePhoto").resolveWith();
    simple.mock(cerdiApi,"submitCreaturePhoto").resolveWith();
    simple.mock(cerdiApi,"retrieveSitePhoto").resolveWith();
    simple.mock(cerdiApi,"retrieveCreaturePhoto").resolveWith();
    simple.mock(cerdiApi,"retrievePhotoMetadata").resolveWith();
    simple.mock(cerdiApi,"forgotPassword").resolveWith();

    return cerdiApi;
}

exports.createCerdiApi = createCerdiApi;