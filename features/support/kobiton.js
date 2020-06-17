const fs = require('fs')
const path = require('path');
const request = require('request-promise-native');
const _ = require("lodash");

class KobitonAPI {
      constructor(username,apiKey) {
        this.auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
        this.headers = {
            'Authorization': 'Basic ' + this.auth,
            'Accept':'application/json',
            'Content-Type':'application/json'
          };
      }

    buildRequestOptions(endpoint,method='GET',body=null) {
        var options = {
            url: (endpoint.startsWith('https://') ? endpoint : `https://api.kobiton.com/v1/${endpoint}`),
            json: true,
            method: method,
            headers: this.headers
        };
        if ( body && method === 'POST' ) {
            options.body = body;
        }
        return options;
    }



     uploadAppVersion( filePath, appId ) {
         var self = this;
        function  generateUploadUrl(filename,appId) {
            return request( self.buildRequestOptions('apps/uploadUrl','POST', { filename: filename, appId: appId } ) );
        }

        function performUpload(urlDetails) {
            return request({ 
                url: urlDetails.url, 
                method: 'PUT', 
                headers: {
                    'Content-Length': fs.statSync(filePath).size,
                    'Content-Type': 'application/octet-stream',
                    "x-amz-tagging": "unsaved=true"
                },
                body: fs.createReadStream( filePath ) 
            }).then( () => urlDetails );
        }

        // returns { appId:  , versionId: }
        function createNewVersion(urlDetails) {
            return request( self.buildRequestOptions('apps','POST', { filename: path.basename(filePath), appPath: urlDetails.appPath } ))
        }
        
        return generateUploadUrl(path.basename(filePath), appId)
            .then( performUpload )
            .then( createNewVersion );
    }

    async getAvailableResolutions(platformName) {
        var res = [];
        return request( this.buildRequestOptions(`devices?platformName=${platformName}`) )
            .then( data => {
                _.each( data.cloudDevices, d => {
                    if ( d.resolution ) {
                        var existingRes = _.find(res, function(r) { if (r) return (r.width === d.resolution.width && d.resolution.height === r.height); else return false; });
                        if ( ! existingRes ) {
                            d.resolution.platformName = d.platformName;
                            res.push(d.resolution);
                        }
                    }
                });
                return res;
            });
    }

    async getAvailableDevicesByResolution(platformName,width,height) {
        if ( platformName === "android" ) platformName = "Android"
        if ( platformName === "ios") platformName = "iOS"
        return request( this.buildRequestOptions(`devices?isBooked=false&&isOnline=true&&platformName=${platformName}`) )
            .then( data => _.filter( data.cloudDevices, d => d.resolution.width === width && d.resolution.height === height ) )
            
    }

    async getLatestVersion(appId) {
        return request( this.buildRequestOptions(`apps/${appId}` ) )
            .then( app => _.orderBy(app.versions, ["id"], ["desc"])[0] )
    }

    async getApplication(appId) {
        return request( this.buildRequestOptions(`apps/${appId}` ) ); 
    }
    
    async getApplications() {
        return request( this.buildRequestOptions('apps') ); 
    }
}
module.exports = KobitonAPI