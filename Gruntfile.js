module.exports = function(grunt) {
    const APP_ID = process.env.APP_ID || 'net.thewaterbug.waterbug';
    const AVD_NAME = process.env.AVD_NAME || 'Nexus7';
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    
    // Project configuration.
    function build(extra_args) {
      return {
        command: `./node_modules/.bin/titanium build --project-dir walta-app ${extra_args}`, 
        stdout: 'inherit', 
        stderr: 'inherit',
        options: { 
          env: Object.assign({}, process.env, {
            "ALLOY_PATH": "./node_modules/.bin/alloy"
          })
        } 
      }
    }

    const SOURCES = [  
    './walta-app/tiapp.xml',  
    './walta-app/app/**/*.js', 
    './walta-app/app/**/*.xml', 
    './walta-app/app/**/*.css' ];

    grunt.initConfig({
      
      exec: {
          mock_server: {
            command: 'node mock-server', stdout: 'inherit', stderr: 'inherit'
          },
          alloy_plugins: {
            command: `./node_modules/.bin/alloy install plugin walta-app`
          },

          clean: {
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app', stdout: 'inherit', stderr: 'inherit'
          },

          clean_test: {
            command: 'rm ./test/*.{apk,ipa}'
          },

          unit_test_android: {
            command: `adb shell am start -n net.thewaterbug.waterbug/.WaterbugActivity --ez "android.intent.action.UnitTest" true`
          },

          build_android_test: build(`--build-only --platform android --target dist-playstore --keystore ${KEYSTORE} --store-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_SUBKEY} --output-dir test`),
          build_ios_test: build("--build-only --platform ios --target dist-adhoc --deploy-type production -R  \"Michael Sharman (6RRED3LUUV)\" -P \"eb88a8c0-d6e1-4622-a69b-3513ebe5be62\" --output-dir test"),

          install_app_android: `adb install ./test/Waterbug.apk`,
          uninstall_app_android: `${process.env.ANDROID_HOME}/platform-tools/adb uninstall ${APP_ID}`,

          install_app_ios: `./node_modules/.bin/ios-deploy --nostart --uninstall --noninteractive --bundle ./test/Waterbug.ipa --bundle_id ${APP_ID}`,
          uninstall_app_ios: `./node_modules/.bin/ios-deploy --uninstall_only --bundle_id ${APP_ID}`,

          acceptance_test_android: {
            command: `PLATFORM="android" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },

          end_to_end_test_android: {
            command: `PLATFORM="android" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`
          },

          quick_acceptance_test_android: {
            command: `QUICK="true" PLATFORM="android" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },

          quick_end_to_end_test_android: {
            command: `QUICK="true" PLATFORM="android" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`
          },

          acceptance_test_ios: {
            command: `PLATFORM="ios" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },

          end_to_end_test_ios: {
            command: `PLATFORM="ios" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`
          },

          quick_acceptance_test_ios: {
            command: `QUICK="true" PLATFORM="ios" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },

          quick_end_to_end_test_ios: {
            command: `QUICK="true" PLATFORM="ios" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`
          },

          // test_console: "calabash-android console walta-app/build/android/bin/Waterbug.apk features/submit_sample.feature"
         // unit_test: `appc ti build --project-dir walta-app --target emulator --device-id ${AVD_NAME} --liveview --platform android --deploy-type development`,
          unit_test_node: `NODE_PATH="./walta-app/app:./walta-app/app/lib" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js`,
          //clean: `rm -rf walta-app/build/* && rm -rf walta-app/dist/* && rm -rf walta-app/Resources/*`,
          debug: build(`--platform android --target emulator --device-id ${AVD_NAME} --debug-host /127.0.0.1:38331`),
          preview_android: build(`--platform android --deploy-type development --liveview -target emulator --device-id ${AVD_NAME}`),
          preview_ios: build(`--platform ios --deploy-type development --target simulator --liveview --device-id "5750311A-5F18-477F-AF43-C97FDB8D49D0"`),
          device_preview_android: build(`--platform android --deploy-type development --target device`),
          device_preview_ios: build(`--liveview --platform ios -V  \"Michael Sharman (ZG6HRCUR8Q)\"  -P \"9bc28620-8680-4eea-9458-c346b32fb4f2\" --deploy-type development --target device `),
          
          release_ios: build(`--build-only --platform ios -R  \"Michael Sharman (6RRED3LUUV)\" -P \"e2935a1f-0c22-4716-8020-b61024ce143f\" --target dist-appstore --output-dir release`),
          release_android: build(` --build-only  --platform android  --target dist-playstore --keystore ${KEYSTORE} --store-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_SUBKEY} --output-dir release`)
        },
        newer: {
          test_android: {
            src: SOURCES,
            dest: './test/Waterbug.apk',
            options: { tasks: [ 'exec:clean','exec:build_android_test'] }  
          },

          test_ios: {
            src: SOURCES,
            dest: './test/Waterbug.ipa',
            options: { tasks: [ 'exec:clean', 'exec:build_ios_test'] }  
          },

          release_android: {
            src: SOURCES,
            dest: './release/Waterbug.apk',
            options: { tasks: [ 'exec:clean','exec:release_android'] }  
          },
          release_ios: {
            src: SOURCES,
            dest: './release/Waterbug.ipa',
            options: { tasks: [ 'exec:clean', 'exec:release_ios' ] }  
          },
        }
    });

    
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-newer-explicit");

    // Default task(s).
    grunt.registerTask('test_ios', [ 'newer:test_ios', 'exec:acceptance_test_ios', 'exec:end_to_end_test_ios' ] );
    grunt.registerTask('test_android', ['newer:test_android', 'exec:uninstall_app_android', 'exec:acceptance_test_android', 'exec:end_to_end_test_android' ] );
    grunt.registerTask('install_ios', ['newer:test_ios', 'exec:install_app_ios' ]);
    grunt.registerTask('install_android', ['newer:test_android', 'exec:install_app_android' ]);
    grunt.registerTask('quick_acceptance_test_ios', [ 'exec:quick_acceptance_test_ios' ] );
    grunt.registerTask('quick_end_to_end_test_ios', ['exec:quick_end_to_end_test_ios' ] );
    grunt.registerTask('quick_acceptance_test_android', [ 'exec:quick_acceptance_test_android' ] );
    grunt.registerTask('quick_end_to_end_test_android', ['exec:quick_end_to_end_test_android' ] );
    grunt.registerTask('unit_test_android', [ 'exec:unit_test_android' ] );
    grunt.registerTask('unit_test_node', ['exec:unit_test_node'] );
    grunt.registerTask('clean', ['exec:clean', 'exec:clean_test'] );
    grunt.registerTask('debug', ['exec:debug'] );
    grunt.registerTask('preview_android', ['exec:preview_android'] );
    grunt.registerTask('preview_ios', ['exec:preview_ios'] );
    grunt.registerTask('device_preview_android', ['exec:uninstall_app_android', 'exec:device_preview_android'] );
    grunt.registerTask('device_preview_ios', ['exec:device_preview_ios'] );
    grunt.registerTask('release_ios', ['newer:release_ios'] );
    grunt.registerTask('release_android', ['newer:release_android'] );
    grunt.registerTask('mock_server', [ 'exec:mock_server' ] );
  
  };