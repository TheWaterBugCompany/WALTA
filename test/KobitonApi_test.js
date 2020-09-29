var KobitonAPI = require('../features/support/kobiton');
var kb = new KobitonAPI("thecodesharman","acbea4cd-f259-42bc-9f75-ad25f9cfec5c");

var WATERBUG_ANDROID_APPID = 59235;
/*kb.getApplications()
    .then( d => d.apps.forEach( a => console.log(`${a.id}: ${a.name} ${a.os}`) ))
    .then( () => kb.uploadAppVersion('builds/release/Waterbug.apk', WATERBUG_ANDROID_APPID) )
    .then( data => console.log(data) )
    .catch( err => console.log(`ERROR: ${err}`));*/
//kb.getAvailableDevicesByResolution("iOS",828,1792)
//    .then( data => data.forEach( d => console.log(`${d.id}\t${d.modelName}\t${d.platformName}\t${d.platformVersion}\t${d.resolution.width}x${d.resolution.height}`) ) );
/*kb.getAvailableResolutions("ios")
    .then( d => d.forEach( r => console.log(`{ width:${r.width}, height:${r.height} },`)) );*/
/*kb.getLatestVersion(WATERBUG_ANDROID_APPID)
    .then( data => console.log(data) );*/