const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

exports.init = (logger, config, cli) => {
   
   if ( cli.argv.platform === 'android' ) {
      cli.on('build.pre.build', {
        priority: 900, 
        post: (builder, callback) => {
            try {
              logger.info('Adding crashlytics plugin dependency to build.gradle');
              // needs to some how modify the buildscript path to include the 
              // dependencies { classpath 'com.google.firebase:firebase-crashlytics-gradle:2.1.0' } code
              const buildPath = path.resolve(__dirname, '..', 'build', 'android', 'build.gradle');
              // find dependencies and add new classpath - is there a less hacky way to do this!!??
              var parts = fs.readFileSync(buildPath, { encoding: "utf8" } ).split("dependencies {");
              parts.splice(1,0,"dependencies {\n\t\tclasspath 'com.google.firebase:firebase-crashlytics-gradle:2.1.0'");
              fs.writeFileSync(buildPath, parts.join('') );
              callback();
            } catch(e) {
              callback(e);
            }
        }
      });
    }
   
    if ( cli.argv.platform === 'iphone' || cli.argv.platform === 'ios' ) {
      cli.on('build.post.compile', { pre: function (data, callback) {
            try {
              logger.info(`Uploading DYSMs for iOS`);
              const buildType = (cli.argv['deploy-type']=== "development"? "Debug-iphonesimulator" : "Release-iphoneos"); 
              //const targetType = (data.target ===)
              const crashlyticsUploadSymbolsPath = path.resolve(__dirname, '..', 'Pods', 'FirebaseCrashlytics', 'upload-symbols');
              const dsymBuildPath = path.resolve(__dirname, '..', 'build', 'iphone', 'build', 'Products', `${buildType}`, 'Waterbug.app.dSYM' );
              const infoPlistPath = path.resolve(__dirname, '..', 'Resources', 'iphone', 'GoogleService-Info.plist');
              execFile(crashlyticsUploadSymbolsPath, [ '-gsp',  infoPlistPath, '-p', 'ios', dsymBuildPath ], 
                ( error, stdout, stderr ) => {
                  if ( stdout )
                    logger.info(stdout);
                  if ( stderr && error ) 
                    logger.error(stderr);
                  callback(error, data);
                } );
            } catch(e) {
              callback(e,data);
            }
      }});
    }
};