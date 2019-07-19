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

          unit_test_android: {
            command: `adb shell am start -n "net.thewaterbug.waterbug/.WaterbugActivity --ez "android.intent.action.UnitTest" true`
          },

          build: build("--build-only --target emulator --platform android --deploy-type development"),

          install_app_android: `adb install ./walta-app/build/android/bin/Waterbug.apk`,

          uninstall_app_android: `adb uninstall ${APP_ID}`,
          // test: "calabash-android run walta-app/build/android/bin/Waterbug.apk features/registration.feature --tags @only"
          acceptance_test: {
            command: `./node_modules/.bin/cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit'
          },

          end_to_end_test: {
            command: `./node_modules/.bin/mocha --timeout 50000 --color --recursive "./end-to-end-testing/*.js"`
          },

          // test_console: "calabash-android console walta-app/build/android/bin/Waterbug.apk features/submit_sample.feature"
         // unit_test: `appc ti build --project-dir walta-app --target emulator --device-id ${AVD_NAME} --liveview --platform android --deploy-type development`,
          unit_test_node: `NODE_PATH="./walta-app/app:./walta-app/app/lib" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js`,
          //clean: `rm -rf walta-app/build/* && rm -rf walta-app/dist/* && rm -rf walta-app/Resources/*`,
          debug: build(`--platform android --target emulator --device-id ${AVD_NAME} --debug-host /127.0.0.1:38331`),
          preview_android: build(`--platform android --deploy-type development --liveview -target emulator --device-id ${AVD_NAME}`),
          preview_ios: build(`--platform ios --deploy-type development --target simulator --liveview --device-id "0797B956-B9F1-4AF5-BFC8-085A97F7F34B"`),
          device_preview_android: build(`--platform android --deploy-type development --target device`),
          device_preview_ios: build(`--platform ios -V  \"Michael Sharman (ZG6HRCUR8Q)\"  -P \"9bc28620-8680-4eea-9458-c346b32fb4f2\" --deploy-type development --target device `),
          release_ios: build(`--build-only --platform ios -R  \"Michael Sharman (6RRED3LUUV)\" -P \"e2935a1f-0c22-4716-8020-b61024ce143f\" --target dist-appstore --output-dir release`),
          release_android: build(` --build-only --platform android  --target dist-playstore --keystore ${KEYSTORE} --store-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_SUBKEY} --output-dir release`)
        },
        newer: {
          titanium_build: {
            src: [  './walta-app/app/**/*.js', 
                      './walta-app/app/**/*.xml', 
                      './walta-app/app/**/*.css' ],
            dest: './walta-app/build/android/bin/Waterbug.apk',
            options: { tasks: [ 'exec:clean', 'exec:uninstall_app_android', 'exec:build', 'exec:install_app_android' ] }  
          }
        }
    });

    
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks("grunt-newer-explicit");
  
    // Default task(s).
    grunt.registerTask('default', ['build'] );
    grunt.registerTask('build', ['exec:clean', 'exec:alloy_plugins', 'exec:build'] );
    grunt.registerTask('acceptance_test', [ 'newer:titanium_build', 'exec:acceptance_test']);
    grunt.registerTask('quick_acceptance_test', [ 'exec:acceptance_test' ] );
    grunt.registerTask('quick_end_to_end_test', ['exec:end_to_end_test' ] );
    grunt.registerTask('unit_test_android', [ 'exec:unit_test_android' ] );
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