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
    const PROFILE = process.env.PROFILE || "e2935a1f-0c22-4716-8020-b61024ce143f";
    const PROFILE_ADHOC = process.env.PROFILE_ADHOC || "eb88a8c0-d6e1-4622-a69b-3513ebe5be62";
    
    const SOURCES = [  
      './walta-app/tiapp.xml',  
      './walta-app/app/**/*.js', 
      './walta-app/app/**/*.xml', 
      './walta-app/app/**/*.css' 
    ];

    function build_if_newer_options(platform,build_type) {
      const ext = (platform === "ios"?"ipa":"apk");
      const tasks = [ "exec:clean",`exec:build:${platform}:${build_type}`];
      if ( build_type !== "release" ) 
        tasks.push(`install:${platform}:${build_type}`);
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
            command: 'rm ./builds/{release,test,unit-test,preview,preview-unit-test}/*.{apk,ipa}',
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
            command: `${process.env.ANDROID_HOME}/platform-tools/adb uninstall ${APP_ID}`
          },

          uninstall_ios: {
            command: `PATH=./node_modules/.bin/:$PATH ios-deploy --uninstall_only --bundle_id ${APP_ID}`
          },

          acceptance_test: {
            command: function(platform,option) {
              return `${option==="quick" ? 'QUICK="true",':""}PLATFORM="${platform}" PATH=./node_modules/.bin/:$PATH cucumber-js --tags "not @skip"`;
            },
            exitCode: [0,1]
          },

          end_to_end_test: {
            command: function(platform,option) {
              return `${option==="quick" ? 'QUICK="true",':""}PLATFORM="${platform}" PATH=./node_modules/.bin/:$PATH mocha --timeout 9990000 --color --recursive "./end-to-end-testing/*.js"`;
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
              let args = [ "--project-dir walta-app", "--build-only" ];

              function production() {
                if ( platform === "android" ) {
                  args.push( "--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--deploy-type production", "--target dist-appstore", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE}\"`);
                } else {
                  throw new Error(`Unknown platform "${platform}"`);
                }
              }

              function test() {
                if ( platform === "android" ) {
                  args.push( "--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
                } else if ( platform === "ios" ){
                  args.push( "--deploy-type production", "--target dist-adhoc", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_ADHOC}\"`);
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
                  args.push("--liveview");
                  args.push("--output-dir builds/preview");
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
            exec: "PATH=./node_modules/.bin/:$PATH appium --log ./appium.log --log-level info:debug",
          },
          live_view_ios: {
            options: { wait: false },
            exec: "PATH=./node_modules/.bin/:$PATH liveview server start -p walta-app --platform ios"
          },
          live_view_android: {
            options: { wait: false },
            exec: "PATH=./node_modules/.bin/:$PATH liveview server start -p walta-app --platform android"
          }
        },

        newer: {
          unit_test_android: build_if_newer_options("android", "unit-test"),
          unit_test_ios: build_if_newer_options("ios", "unit-test"),

          test_android: build_if_newer_options("android", "test"),
          test_ios: build_if_newer_options("ios", "test"),

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
    function startAppium(caps) {
      
      let p;
      if ( appium_session ) {
        p = stopAppiumClient(appium_session);
      } else {
        p = Promise.resolve();
      }
      return  p.then( () => startAppiumClient( caps ) )
        .then( (driver) => {
          appium_session = driver;
          return driver;
        } )
        .catch( (err) => { grunt.fail.warn(err); } );
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
        .then( done );
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
      
      const retain = (platform === "android"? new RegExp(`(${_.map(levels, (l) => l.charAt(0)).join("|")}) +TiAPI +: +`,"m"): new RegExp(`\\[(${levels.join("|")})\\]`,"m") );
      function delay(t) {
        return new Promise( resolve => setTimeout(resolve, t) ); 
      }

      async function processLogs() {
        let stop = false;
        while( !stop || option === "preview") {
          let logs = await appium_session.getLogs(platform==="android"?"logcat":"syslog");
          logs.forEach( (line) => {
            if ( />>>>> UNIT TESTS: (.*)/.test(line.message) ) {
              stop = true;
            } else if ( line.message.includes(platform === "android"? "TiAPI":"Waterbug(TitaniumKit)") && retain.test(line.message)) {
              let parts = line.message.split(retain);
              if ( parts.length >= 1 ) {
                grunt.log.writeln(decodeSyslog(parts[2]));
              } 
            } 
          });
          await delay(100);
        }
      }

      processLogs().then(done);
    });
    
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-newer-explicit");

    grunt.registerTask('test', function (platform) {
      grunt.task.run('run:appium');
      grunt.task.run(`unit-test:${platform}`);
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });

    grunt.registerTask('end-to-end-test', function (platform) {
      grunt.task.run('run:appium');
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
    });

    grunt.registerTask('acceptance-test', function (platform) {
      grunt.task.run('run:appium');
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });

    
    grunt.registerTask('unit-test', function( platform ) {
      grunt.task.run('run:appium');
      grunt.task.run(`newer:unit_test_${platform}`);
      grunt.task.run(`launch:${platform}:unit-test` );
      grunt.task.run(`output-logs:${platform}`);

    } );

    grunt.registerTask('dist-clean', ['exec:clean', 'exec:clean_test'] );
    grunt.registerTask('preview', function(platform,option) {
      grunt.task.run("run:appium");
      // It's often possible to get away without do a rebuild and relying on the file server 
      // to copy changes to the device. The quick option enables that.
      if ( option !== "quick") { 
        grunt.task.run(`newer:preview_${platform}`);
      } 
      grunt.task.run("exec:stop_live_view");
      grunt.task.run(`run:live_view_${platform}`);
      grunt.task.run(`launch:${platform}:preview`);

      // the preview option here enters an infinite loop so that the log output
      // continues as changes are made during development
      grunt.task.run(`output-logs:${platform}:preview`);
    } );

    grunt.registerTask('preview-unit-test', function(platform,option) {
      grunt.task.run("run:appium");
      if ( option !== "quick") { 
        grunt.task.run(`newer:preview_unit_test_${platform}`);
      } 
      grunt.task.run("exec:stop_live_view");
      grunt.task.run(`run:live_view_${platform}`);
      grunt.task.run(`launch:${platform}:preview-unit-test`);
      grunt.task.run(`output-logs:${platform}:preview`);
    } );
  
    grunt.registerTask('release', function(platform) {
      grunt.task.run(`newer:release_${platform}`); 
    });
  };