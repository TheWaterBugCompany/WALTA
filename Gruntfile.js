module.exports = function(grunt) {
    const { getCapabilities, startAppiumClient, stopAppiumClient } = require("./features/support/appium")
    const { decodeSyslog } = require('./features/support/ios-colors');
    const _ = require("lodash");
    const APP_ID = "net.thewaterbug.waterbug";
    const APP_ACTIVITY = ".WaterbugActivity";
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    const DEVELOPER = process.env.DEVELOPER || "Michael Sharman (6RRED3LUUV)";
    const PROFILE = process.env.PROFILE || "7081d6f7-618b-4c10-b5bb-e48e63085767";
    const PROFILE_ADHOC = process.env.PROFILE_ADHOC || "810ab12c-fd91-41f7-a2c0-91bff72afe05";
    
    const SOURCES = [  
      './walta-app/tiapp.xml',  
      './walta-app/app/**/*.js', 
      './walta-app/app/**/*.xml', 
      './walta-app/app/**/*.css',
      './walta-app/app/**/*.tss' 
    ];

    function build_if_newer_options(platform,build_type) {
      const ext = (platform === "ios"?"ipa":"apk");
      const tasks = ['exec:clean', `exec:build:${platform}:${build_type}`]; 
      return {
        src: SOURCES,
        dest: `./builds/${build_type}/Waterbug.${ext}`,
        options: { tasks: tasks }  
      }
    }

    grunt.initConfig({
      exec: {
          mock_server: {
            command: 'node mock-server',
            stdout: "inherit", stderr: "inherit"
          },

          clean: {
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app',
            stdout: "inherit", stderr: "inherit"
          },

          clean_test: {
            command: 'rm ./builds/{release,debug,test,unit-test,preview,preview-unit-test}/*.{apk,ipa,aab}',
            exitCode: [ 0, 1 ],
            stdout: "inherit", stderr: "inherit"
          },

          install_android: {
            command: function(build_type) { 
              return `${process.env.ANDROID_HOME}/platform-tools/adb install ./builds/${build_type}/Waterbug.apk`;
            }
          },

          install_ios: {
            command: function(build_type) { 
                return `PATH=./node_modules/.bin/:$PATH ios-deploy --bundle ./builds/${build_type}/Waterbug.ipa`;
            }, stdout: false, stderr: true
          },

          uninstall_android: {
            command: `${process.env.ANDROID_HOME}/platform-tools/adb uninstall ${APP_ID}`,
            exitCode: [ 0, 255 ]
          },

          uninstall_ios: {
            command: `PATH=./node_modules/.bin/:$PATH ios-deploy --uninstall_only --bundle_id ${APP_ID}`
          },

          acceptance_test: {
            command: function(platform,option) {
              return `${option==="quick" ? 'QUICK="true" ':""} PLATFORM="${platform}" PATH=./node_modules/.bin/:$PATH cucumber-js --tags "not @skip"`;
            },
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          end_to_end_test: {
            command: function(platform,option,host) {
              return `${option==="quick" ? 'QUICK="true" ':""} PLATFORM="${platform}" ${host?'HOST='+host:""} PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 "./end-to-end-testing/*.js"`;
            },
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          unit_test_node: {
            command: `PATH=./node_modules/.bin/:$PATH mocha`,
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          build: {
            command: function(platform,build_type) {
              let args = [ "--project-dir walta-app"];

              function production() {
                if ( platform === "android" ) {
                  args.push( "--build-only", "--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--build-only","--deploy-type production", "--target dist-appstore", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE}\"`);
                } else {
                  throw new Error(`Unknown platform "${platform}"`);
                }
              }

              function test() {
                if ( platform === "android" ) {
                  args.push( "--build-only","--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--build-only","--deploy-type production", "--target dist-adhoc", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_ADHOC}\"`);
                } else {
                  throw new Error(`Unknown platform "${platform}"`);
                }
              }

              function emulator() {
                if ( platform === "android" ) {
                  args.push( "--deploy-type development", "--target emulator", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--deploy-type development", "--target simulator", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_ADHOC}\"`);
                } else {
                  throw new Error(`Unknown platform "${platform}"`);
                }
              }


              if ( platform ) {
                args.push(`--platform ${platform}`);
              } else {
                throw new Error("please specify platform!");
              }

              switch( build_type ) {
                case "debug":
                  test();
                  args.push("--output-dir builds/debug --debug-host=localhost:9229")
                  break;
                
                case "test":
                  test();
                  args.push("--output-dir builds/test");
                  break;

                case "unit-test":
                  test();
                  args.push("--unit-test");
                  args.push("--output-dir builds/unit-test");
                  break;

                case "release":
                  production();
                  args.push("--output-dir builds/release");
                  break;

                case "preview":
                  test();
                  //args.push("--liveview");
                  args.push("--output-dir builds/preview");
                  break;

                case "emulate":
                  emulator();
                  args.push("--liveview");
                  break;

                case "preview-unit-test":
                  test();
                  args.push("--liveview");
                  args.push("--unit-test");
                  args.push("--output-dir builds/preview-unit-test");
                  break;

                default:
                  throw new Error(`Unknown build "${build_type}" type!`)
              }
              return `./node_modules/.bin/titanium build ${args.join(" ")}`;
            },
            options: { 
                env: Object.assign({}, process.env, {
                  "ALLOY_PATH": "./node_modules/.bin/alloy"
                })
              },
            stdout: "inherit", stderr: "inherit"
          },

          stop_live_view: {
            command: "./node_modules/.bin/liveview server stop",
            exitCode: [ 0, 1 ],
            stdout: "inherit", stderr: "inherit"
          },
              
        },

        run: {
          appium: {
            options: { 
              wait: false,
              quiet: true,
              ready: /Appium REST http interface listener started on/ 
            },
            exec: "PATH=./node_modules/.bin/:$PATH appium --log ./appium.log --log-level info:error",
          },
          live_view_ios: {
            options: { wait: false, ready: "Event Server Started"  },
            exec: "PATH=./node_modules/.bin/:$PATH liveview server start -p walta-app --platform ios"
          },
          live_view_android: {
            options: { wait: false, ready: "Event Server Started" },
            exec: "PATH=./node_modules/.bin/:$PATH liveview server start -p walta-app --platform android"
          }
        },

        newer: {
          unit_test_android: build_if_newer_options("android", "unit-test"),
          unit_test_ios: build_if_newer_options("ios", "unit-test"),

          test_android: build_if_newer_options("android", "test"),
          test_ios: build_if_newer_options("ios", "test"),

          debug_android: build_if_newer_options("android", "debug"),
          debug_ios: build_if_newer_options("ios", "debug"),

          emulate_android: build_if_newer_options("android", "emulate"),
          emulate_ios: build_if_newer_options("ios", "emulate"),

          release_android: build_if_newer_options("android", "release"),
          release_ios: build_if_newer_options("ios", "release"),

          preview_android: build_if_newer_options("android", "preview"),
          preview_ios: build_if_newer_options("ios", "preview"),

          preview_unit_test_android: build_if_newer_options("android", "preview-unit-test"),
          preview_unit_test_ios: build_if_newer_options("ios", "preview-unit-test"),
        }
    });

    // keep track of the current appium session
    let appium_session = null;
    function startAppium(caps, host = 'local') {
      
      let p;
      if ( appium_session ) {
        p = stopAppiumClient(appium_session);
      } else {
        p = Promise.resolve();
      }
      function setUpSession() {
        return startAppiumClient( caps, host ) 
          .then( (driver) => {
            appium_session = driver;
            return driver;
          } )
      }
      return  p.then( setUpSession );
    }

    function terminateApp(platform) {
      return () => appium_session.terminateApp(platform === "android"?APP_ID:undefined,platform === "ios"?APP_ID:undefined);
    }

    grunt.registerTask("install", function(platform,build_type) {
      grunt.task.run(`exec:uninstall_${platform}`);
      grunt.task.run(`exec:install_${platform}:${build_type}`);
    });

    grunt.registerTask("launch", function(platform,build_type) {
      const done = this.async();
      const caps = getCapabilities(platform,true);
      caps.skipLogCapture = false;
      startAppium(caps) 
        .catch( () => {
          grunt.log.writeln("Attempting to start appium server");
          grunt.task.run('run:appium');
          grunt.task.run(`launch:${platform}:${build_type}`);
        })
        .then( done )
    });

    grunt.registerTask("terminate", function(platform,build_type) {
      const done = this.async();
      const caps = getCapabilities(platform,true);
      caps.autoLaunch = false;
      startAppium(caps)
        .then( terminateApp(platform) )
        .then( done );
    });

    grunt.registerTask("output-logs", function(platform,option) {
      let done = this.async();
      const levels = [ "ERROR", "WARN", "INFO" ];
      if ( process.env.DEBUG )
        levels.push("DEBUG");
      
      const retain = (platform === "android"? new RegExp(`(${_.map(levels, (l) => l.charAt(0)).join("|")}) +Ti\\w+ +: +`,"m"): new RegExp(`\\[(${levels.join("|")})\\]`,"m") );
      function delay(t) {
        return new Promise( resolve => setTimeout(resolve, t) ); 
      }
      const logFilter = (platform === "android"? /Ti\w+/ : /Waterbug\(TitaniumKit\)/);
      async function processLogs() {
        let stop = false;
        while( !stop || option === "preview") {
          let logs = await appium_session.getLogs(platform==="android"?"logcat":"syslog");
          logs.forEach( (line) => {
            
            if ( />>>>> UNIT TESTS: (.*)/.test(line.message) ) {
              stop = true;
            } else if ( logFilter.test(line.message) && retain.test(line.message)) {
              let parts = line.message.split(retain);
              if ( parts.length >= 1 ) {
                grunt.log.writeln(decodeSyslog(parts[2]));
              } 
            } 
          });
          await delay(100);
        }
      }
      (function() { if ( ! appium_session ) {
        const caps = getCapabilities(platform,true);
        caps.autoLaunch = false;
        return startAppium(caps);
      } else {
        return Promise.resolve();
      }})().then( processLogs )
          .then( done );
    });
    
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-newer-explicit");
    grunt.loadNpmTasks("grunt-then");

    grunt.registerTask('test', function (platform) {
      //grunt.task.run('run:appium');
      grunt.task.run(`unit-test:${platform}`);
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`install:${platform}:test`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });

    grunt.registerTask('end-to-end-test', function (platform,option,host) {
      //grunt.task.run('run:appium');
      if ( option !== "quick" ) {
        grunt.task.run(`newer:test_${platform}`);
        grunt.task.run(`install:${platform}:test`);
      }
      grunt.task.run(`exec:end_to_end_test:${platform}${option === "quick"?":quick":""}${host?":"+host:""}`);
    });

    grunt.registerTask('acceptance-test', function (platform,option) {
      //grunt.task.run('run:appium');
      if ( option !== "quick" ) {
        grunt.task.run(`newer:test_${platform}`);
        grunt.task.run(`install:${platform}:test`);
      }
      grunt.task.run(`exec:acceptance_test:${platform}${option === "quick"?":quick":""}`);
    });

    
    grunt.registerTask('unit-test', function( platform ) {
      //grunt.task.run('run:appium');
      grunt.task.run(`newer:unit_test_${platform}`);
      grunt.task.run(`install:${platform}:unit-test`);
      grunt.task.run(`launch:${platform}:unit-test`);
      grunt.task.run(`output-logs:${platform}`);

    } );

    grunt.registerTask('dist-clean', ['exec:clean', 'exec:clean_test'] );
    grunt.registerTask('preview', function(platform,option) {
      //grunt.task.run("run:appium");
      // It's often possible to get away without do a rebuild and relying on the file server 
      // to copy changes to the device. The quick option enables that.
      if ( option !== "quick") { 
        grunt.task.run(`newer:preview_${platform}`);
        grunt.task.run(`install:${platform}:preview`);
      } 
      grunt.task.run("exec:stop_live_view");
      grunt.task.run(`run:live_view_${platform}`);
      grunt.task.run(`launch:${platform}:preview`);

      // the preview option here enters an infinite loop so that the log output
      // continues as changes are made during development
      grunt.task.run(`output-logs:${platform}:preview`);
    } );

    grunt.registerTask('preview-unit-test', function(platform,option) {
      //grunt.task.run("run:appium");
      if ( option !== "quick") { 
        grunt.task.run(`newer:preview_unit_test_${platform}`);
        grunt.task.run(`install:${platform}:preview-unit-test`);
      } 
      grunt.task.run("exec:stop_live_view");
      grunt.task.run(`run:live_view_${platform}`);
      grunt.task.run(`launch:${platform}:preview-unit-test`);
      grunt.task.run(`output-logs:${platform}:preview`);
    } );
  
    grunt.registerTask('release', function(platform) {
      grunt.task.run(`newer:release_${platform}`); 
    });

    grunt.registerTask('debug', function(platform) {
      grunt.task.run(`newer:debug_${platform}`); 
      grunt.task.run(`install:${platform}:debug`);
      grunt.task.run(`launch:${platform}:debug`);
      grunt.task.run(`output-logs:${platform}:preview`);
    })

    grunt.registerTask('emulate', function(platform) {
      grunt.task.run(`newer:emulate_${platform}`); 
      grunt.task.run(`output-logs:${platform}:preview`);
    })
  };