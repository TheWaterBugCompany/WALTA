module.exports = function(grunt) {
    const APP_ID = process.env.APP_ID || 'net.thewaterbug.waterbug';
    const AVD_NAME = process.env.AVD_NAME || 'Nexus7';
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    
    // Project configuration.
    grunt.initConfig({
      exec: {
          mock_server: {
            command: 'node mock-server', stdout: 'inherit', stderr: 'inherit'
          },
          clean: {
            command: `appc ti clean --project-dir walta-app`, stdout: 'inherit', stderr: 'inherit'
          },
          build: {
            command: `appc ti build --build-only --project-dir walta-app --target emulator --platform android --deploy-type development`, stdout: 'inherit', stderr: 'inherit'
          },
          uninstall_app: `adb uninstall ${APP_ID}`,
          // test: "calabash-android run walta-app/build/android/bin/Waterbug.apk features/registration.feature --tags @only"
          acceptance_test: {
            command: `./node_modules/.bin/cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },
          // test_console: "calabash-android console walta-app/build/android/bin/Waterbug.apk features/submit_sample.feature"
          unit_test: `appc ti build --project-dir walta-app --target emulator --device-id ${AVD_NAME} --liveview --platform android --deploy-type development`,
          unit_test_node: `NODE_PATH="./walta-app/app:./walta-app/app/lib" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js`,
          clean: `rm -rf walta-app/build/* && rm -rf walta-app/dist/* && rm -rf walta-app/Resources/*`,
          debug: `appc ti build --project-dir walta-app --platform android --target emulator --device-id ${AVD_NAME} --debug-host /127.0.0.1:38331`,
          preview_android: `appc ti build  --project-dir walta-app --platform android --deploy-type development --liveview --target emulator --device-id ${AVD_NAME}`,
          
          /* iphone 6s =      AEA9B0BA-8715-4029-AE8A-1CAFE77653E1
             iphone 6s plus = E99CE79B-97BF-49B8-9357-C3DFE5611EF2
             iphone 5s =      C03480F3-D5A7-4444-A1FA-1CA9AF7D9861
             ipad mini =      85EDE93D-CFEA-40F5-8CD7-ED2556D9472F*/
          preview_ios: `appc ti build --project-dir walta-app --platform ios --deploy-type development --target simulator --liveview --device-id "AEA9B0BA-8715-4029-AE8A-1CAFE77653E1"`,
          device_preview_android: `appc ti build --force --project-dir walta-app --platform android --deploy-type development --target device`,
          device_preview_ios: `appc ti build --project-dir walta-app --platform ios --deploy-type development --target device`,
          release_ios: `appc ti build --project-dir walta-app --build-only --platform ios -R  \"Michael Sharman (6RRED3LUUV)\" -P \"e2935a1f-0c22-4716-8020-b61024ce143f\" --target dist-appstore --output-dir release`,
          release_android: `appc ti build --project-dir walta-app --build-only --platform android  --target dist-playstore --keystore ${KEYSTORE} --store-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_SUBKEY} --output-dir release`
        },
        newer: {
          titanium_build: {
            src: [  './walta-app/app/**/*.js', 
                      './walta-app/app/**/*.xml', 
                      './walta-app/app/**/*.css' ],
            dest: './walta-app/build/android/bin/Waterbug.apk',
            options: { tasks: [ 'exec:clean', 'exec:build' ] }  
          }
        }
    });

    
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks("grunt-newer-explicit");
  
    // Default task(s).
    grunt.registerTask('default', ['build'] );
    grunt.registerTask('build', ['exec:build'] );
    grunt.registerTask('acceptance_test', [ 'newer:titanium_build', 'exec:acceptance_test']);
    grunt.registerTask('unit_test', ['exec:unit_test'] );
    grunt.registerTask('unit_test_node', ['exec:unit_test_node'] );
    grunt.registerTask('clean', ['exec:clean'] );
    grunt.registerTask('debug', ['exec:debug'] );
    grunt.registerTask('preview_android', ['exec:preview_android'] );
    grunt.registerTask('preview_ios', ['exec:preview_ios'] );
    grunt.registerTask('device_preview_android', ['exec:device_preview_android'] );
    grunt.registerTask('device_preview_ios', ['exec:device_preview_ios'] );
    grunt.registerTask('release_ios', ['exec:release_ios'] );
    grunt.registerTask('release_android', ['exec:release_android'] );
    grunt.registerTask('mock_server', [ 'exec:mock_server' ] );
  
  };