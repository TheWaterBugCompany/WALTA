module.exports = function(grunt) {
    const APP_ID = "net.thewaterbug.waterbug";
    const APP_ACTIVITY = ".WaterbugActivity";
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    const DEVELOPER = process.env.DEVELOPER || "Michael Sharman (6RRED3LUUV)";
    const PROFILE = process.env.PROFILE || "eb88a8c0-d6e1-4622-a69b-3513ebe5be62";
    
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

          clean: {
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app', stdout: 'inherit', stderr: 'inherit'
          },

          clean_test: {
            command: 'rm ./test/*.{apk,ipa} || rm ./unit-test/*.{apk,ipa}'
          },

          install: {
            command: function(platform,build_type) {
              if ( platform === "android" ) {
                return `adb install ./${build_type}/Waterbug.apk`;
              } else if ( platform === "ios" ) {
                return `./node_modules/.bin/ios-deploy --no-wifi --nostart --uninstall --bundle ./${build_type}/Waterbug.app`;
              } else {
                throw new Error(`Unknown platform "${platform}"`);
              }
            },
            stdout: false
          },

          uninstall: {
            command: function(platform,build_type) {
            if ( platform === "android" ) {
              return `${process.env.ANDROID_HOME}/platform-tools/adb uninstall ${APP_ID}`;
            } else if ( platform === "ios" ) {
              return `./node_modules/.bin/ios-deploy --uninstall_only --bundle_id ${APP_ID}`;
            } else {
              throw new Error(`Unknown platform "${platform}"`);
            }
           },
           stdout: false
          },

          launch: {
             command: function(platform) {
                
                if ( platform === "android" ) {
                  return `${process.env.ANDROID_HOME}/platform-tools/adb shell am start -W -S -n ${APP_ID}/${APP_ACTIVITY}`;
                } else if ( platform === "ios" ) {
                  return `./node_modules/.bin/ios-deploy --no-wifi -m --bundle_id ${APP_ID}`;
                } else {
                  throw new Error(`Unknown platform "${platform}"`);
                }
              }
          },

          acceptance_test_android: {
            command: `PLATFORM="android" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit',
            exitCode: [ 0, 1 ]
          },

          end_to_end_test_android: {
            command: `PLATFORM="android" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`,
            exitCode: [ 0, 1 ]
          },

          quick_acceptance_test_android: {
            command: `QUICK="true" PLATFORM="android" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit',
            exitCode: [ 0, 1 ]
          },

          quick_end_to_end_test_android: {
            command: `QUICK="true" PLATFORM="android" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`,
            exitCode: [ 0, 1 ]
          },

          acceptance_test_ios: {
            command: `PLATFORM="ios" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit',
            exitCode: [ 0, 1 ]
          },

          end_to_end_test_ios: {
            command: `PLATFORM="ios" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`,
            exitCode: [ 0, 1 ]
          },

          quick_acceptance_test_ios: {
            command: `QUICK="true" PLATFORM="ios" PATH=./node_modules/.bin/:$PATH cucumber-js --tags @only`, stdout: 'inherit', stderr: 'inherit',
            exitCode: [ 0, 1 ]
          },

          quick_end_to_end_test_ios: {
            command: `QUICK="true" PLATFORM="ios" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`,
            exitCode: [ 0, 1 ]
          },

          unit_test_node: `NODE_PATH="./walta-app/app:./walta-app/app/lib" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js`,
          //debug: build(`--platform android --target emulator --device-id ${AVD_NAME} --debug-host /127.0.0.1:38331`),

          build: {
            command: function(platform,build_type) {
              let args = [ "--project-dir walta-app", "--build-only" ];

              function production() {
                if ( platform === "android" ) {
                  args.push( "--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--deploy-type production", "--target dist-adhoc", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE}\"`);
                } else {
                  throw new Error(`Unknwon platform "${platform}"`);
                }
              }

              if ( platform ) {
                args.push(`--platform ${platform}`);
              } else {
                throw new Error("please specify platform!");
              }

              switch( build_type ) {
                case "test":
                  production();
                  args.push("--output-dir test");
                  break;

                case "unit-test":
                  production();
                  args.push("--unit-test");
                  args.push("--output-dir unit-test");
                  break;

                case "release":
                  production();
                  args.push("--output-dir release");
                  break;

                case "preview":
                  production();
                  args.push("--liveview");
                  args.push("--output-dir preview");
                  break;

                case "preview/unit-test":
                  production();
                  args.push("--unit-test");
                  args.push("--liveview");
                  args.push("--output-dir preview/unit-test");
                  break;

                default:
                  throw new Error(`Unknown build "${build_type}" type!`)
              }
              return `./node_modules/.bin/titanium build ${args.join(" ")}`;
            },
            stdout: 'inherit', 
            stderr: 'inherit',
            options: { 
                env: Object.assign({}, process.env, {
                  "ALLOY_PATH": "./node_modules/.bin/alloy"
                })
              },
          },

          stop_live_view: {
            command: "./node_modules/.bin/liveview server stop",
            exitCode: [ 0, 1 ]
          },
              
        },

        run: {
         
          start_live_view: {
            options: { wait: false },
            exec: "./node_modules/.bin/liveview server start -p walta-app"
          }
        },

        newer: {
          unit_test_android: {
            src: SOURCES,
            dest: "./unit-test/Waterbug.apk",
            options: { tasks: [ "exec:clean","exec:build:android:unit-test"] }  
          },

          unit_test_ios: {
            src: SOURCES,
            dest: './unit-test/Waterbug.ipa',
            options: { tasks: [ 'exec:clean', 'exec:build:ios:unit-test'] }  
          },

          test_android: {
            src: SOURCES,
            dest: "./test/Waterbug.apk",
            options: { tasks: [ "exec:clean","exec:build:android:test"] }  
          },

          test_ios: {
            src: SOURCES,
            dest: "./test/Waterbug.ipa",
            options: { tasks: [ "exec:clean", "exec:build:ios:test"] }  
          },

          release_android: {
            src: SOURCES,
            dest: "./release/Waterbug.apk",
            options: { tasks: [ "exec:clean", "exec:build:android:release" ] }  
          },
          release_ios: {
            src: SOURCES,
            dest: "./release/Waterbug.ipa",
            options: { tasks: [ "exec:clean", "exec:build:ios:release" ] }  
          },

          preview_android: {
            src: SOURCES,
            dest: "./preview/Waterbug.apk",
            options: { tasks: [ "exec:clean", "exec:build:android:preview" ] }  
          },

          preview_ios: {
            src: SOURCES,
            dest: "./preview/Waterbug.ipa",
            options: { tasks: [ "exec:clean", "exec:build:ios:preview" ] }  
          },

          preview_unit_test_android: {
            src: SOURCES,
            dest: "./preview/unit-test/Waterbug.apk",
            options: { tasks: [ "exec:clean", "exec:build:android:preview" ] }  
          },
          preview_unit_test_ios: {
            src: SOURCES,
            dest: "./preview/unit-test/Waterbug.ipa",
            options: { tasks: [ "exec:clean", "exec:build:ios:preview" ] }  
          },
        }
    });

    
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-newer-explicit");

    // Default task(s).
    grunt.registerTask('test_ios', [ 'unit_test_ios', 'newer:test_ios', 'exec:end_to_end_test_ios', 'exec:acceptance_test_ios' ] );
    grunt.registerTask('test_android', [ 'unit_test_ios', 'newer:test_android', 'exec:acceptance_test_android', 'exec:end_to_end_test_android' ] );
    grunt.registerTask('install_ios', ['newer:test_ios', 'exec:install_app_ios' ]);
    grunt.registerTask('install_android', ['newer:test_android', 'exec:install_app_android' ]);
    grunt.registerTask('quick_acceptance_test_ios', [ 'exec:quick_acceptance_test_ios' ] );
    grunt.registerTask('quick_end_to_end_test_ios', ['exec:quick_end_to_end_test_ios' ] );
    grunt.registerTask('quick_acceptance_test_android', [ 'exec:quick_acceptance_test_android' ] );
    grunt.registerTask('quick_end_to_end_test_android', ['exec:quick_end_to_end_test_android' ] );
    grunt.registerTask('unit_test_android', [ 'exec:unit_test_android' ] );
    grunt.registerTask('unit_test_ios', [ "newer:unit_test_ios", "exec:unit_test_ios" ] );
    grunt.registerTask('unit_test_node', [ "newer:unit_test_android","exec:unit_test_node"] );
    grunt.registerTask('clean', ['exec:clean', 'exec:clean_test'] );
    grunt.registerTask('debug', ['exec:debug'] );

    grunt.registerTask('preview', function(platform) {
      grunt.task.run("exec:stop_live_view");
      grunt.task.run("run:start_live_view");
      grunt.task.run(`exec:launch:${platform}:preview`);
      grunt.task.run("wait:start_live_view");
    } );
  

    grunt.registerTask('device_preview_android', ['exec:uninstall_app_android', 'exec:device_preview_android'] );
    grunt.registerTask('device_preview_ios', ['exec:device_preview_ios'] );

    grunt.registerTask('release_ios', ['newer:release_ios'] );
    grunt.registerTask('release_android', ['newer:release_android'] );
    grunt.registerTask('mock_server', [ 'exec:mock_server' ] );
  
  };