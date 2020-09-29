module.exports = function(grunt) {
    const { getCapabilities, startAppiumClient, stopAppiumClient } = require("./features/support/appium")
    const { decodeSyslog } = require('./features/support/ios-colors');
    const _ = require("lodash");
    const KobitonAPI = require("./features/support/kobiton");

    const fs = require('fs');
    const CircularJSON = require("circular-json");
    const KeyLoader = require("./walta-app/app/lib/logic/KeyLoaderInk");


    const APP_ID = "net.thewaterbug.waterbug";
    const APP_ACTIVITY = ".WaterbugActivity";
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    const DEVELOPER = process.env.DEVELOPER || "Michael Sharman (6RRED3LUUV)";
    const PROFILE = process.env.PROFILE || "7081d6f7-618b-4c10-b5bb-e48e63085767";
    const PROFILE_ADHOC = process.env.PROFILE_ADHOC || "810ab12c-fd91-41f7-a2c0-91bff72afe05";
    
    const WATERBUG_APPID = {
      "android": 59235,
      "ios": 59244
    }

    const SOURCES = [  
      './walta-app/tiapp.xml',  
      './walt-app/app/assets/**/*',
      './walta-app/app/**/*.js', 
      './walta-app/app/**/*.xml', 
      './walta-app/app/**/*.css',
      './walta-app/app/**/*.tss' 
    ]; 

    const Kobiton = new KobitonAPI("thecodesharman","acbea4cd-f259-42bc-9f75-ad25f9cfec5c");

    // List of possible resolutions, not all resolutions are available on all platforms though
    const AVAILABLE_SCREEN_SIZES =
    {
      "android": [
        { width:1080, height:1920 },
        { width:1080, height:2220 },
        { width:1440, height:3200 },
        { width:720, height:1280 },
        { width:1440, height:2560 },
        { width:1440, height:3040 },
        { width:720, height:1520 },
        { width:720, height:1560 },
        { width:1440, height:2960 },
        { width:1440, height:2880 },
        { width:480, height:854 },
        { width:1200, height:1920 },
        { width:1536, height:2048 },
        { width:1080, height:2160 },
        { width:1080, height:2280 },
        { width:1600, height:2560 },
        { width:1080, height:2520 },
        { width:1440, height:3120 },
        { width:1080, height:2340 },
        { width:2560, height:1800 },
        { width:800, height:1280 },
        { width:1080, height:2270 },
        { width:1080, height:2312 }
      ],
      "ios":[
        { width:1080, height:1920 },
        { width:1536, height:2048 },
        { width:750, height:1334 },
        { width:1125, height:2436 },
        { width:2048, height:2732 },
        { width:1242, height:2688 },
        { width:640, height:1136 },
        { width:828, height:1792 },
        { width:1668, height:2388 },
        { width:1668, height:2224 }
      ]
    } 
    
    function build_app(platform,build_type) {
      let args = [ "--project-dir walta-app"];
      let post_cmds = [];

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

      function dev() {
        if ( platform === "android" ) {
          args.push( "--build-only","--deploy-type development", "--target device" );
        } else if ( platform === "ios" ){
          args.push( "--build-only","--deploy-type development", "--target device");
        } else {
          throw new Error(`Unknown platform "${platform}"`);
        }
      }

      function emulator() {
        if ( platform === "android" ) {
          args.push( "--deploy-type development", "--target emulator", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`, '-C "Default"'); 
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
          dev();
          if ( platform === "android" ) {
            post_cmds.push( "cp ./walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk ./builds/preview/Waterbug.apk");
          } else {
            post_cmds.push( "cp ./walta-app/build/iphone/build/Products/Debug-iphoneos/Waterbug.app ./builds/preview/Waterbug.app");
          }
          break;

        case "emulate":
          emulator();
          break;

        case "preview-unit-test":
          test();
          args.push("--unit-test");
          args.push("--output-dir builds/preview-unit-test");
          break;

        default:
          throw new Error(`Unknown build "${build_type}" type!`)
      }
      if ( grunt.option('liveview') ) {
        args.push("--liveview");
      }

      var cmd = `./node_modules/.bin/titanium build ${args.join(" ")}`;
      post_cmds.forEach( c => cmd += " && " + c);
      return cmd;
    }


    function build_if_newer_options(platform,build_type) {
      const ext = (platform === "ios"?"ipa":"apk");
      const tasks = [];
      
      if ( ! grunt.option('skip-build') ) {
        tasks.push(`exec:build:${platform}:${build_type}`);
        if ( grunt.option('kobiton') ) {
          tasks.push(`upload:${platform}:${build_type}`);
        } else {
          if ( build_type !== "release" ) {
            tasks.push(`install:${platform}:${build_type}`);
          }
        }
      }
      return {
        src: SOURCES,
        dest: `./builds/${build_type}/Waterbug.${ext}`,
        options: { tasks: tasks }  
      }
    }

    function envVars() {
      return {
        "PATH": `./node_modules/.bin/:${process.env.PATH}`,
        "PLATFORM": grunt.option('platform'),
        "HOST": (grunt.option('kobiton') ? "kobiton":null)
      }
    }

    

    grunt.initConfig({
      browserify: {
        mayfly: {
          src: [ 'walta-app/app/lib/util/WktUtils.js' ],
          dest: 'walta-app/app/assets/browserify/mayfly.js',
          options: {
            browserifyOptions: {
              "standalone": "WktUtils"
            },
          }
        }
      },
      parallel: {
        visual_regression_test: {
          options: {
            grunt: true
          },
          tasks: AVAILABLE_SCREEN_SIZES[(grunt.option('platform')?grunt.option('platform'):'android')].map( r => `exec:visual_regression_test:${r.width}:${r.height}`)
        }
      },
      exec: {
          mock_server: {
            command: 'node mock-server',
            stdout: "inherit", stderr: "inherit"
          },

          clean: {
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app',
            stdout: "inherit", stderr: "inherit"
          },

          clean_dist: {
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
            exitCode: [ 0, 1, 255 ]
          },

          uninstall_ios: {
            command: `PATH=./node_modules/.bin/:$PATH ios-deploy --uninstall_only --bundle_id ${APP_ID}`
          },

          acceptance_test: {
            command: function(platform,option) {
              return `VERSION=${grunt.option('kobiton-version')} cucumber-js --tags "not @skip"`;
            },
            options: {
              env: envVars()
            },
            exitCode: [0,1]
          },

          end_to_end_test: {
            command: function(platform,option) {
              return `VERSION=${grunt.option('kobiton-version')}  mocha --timeout 60000 "./end-to-end-testing/*.js"`;
            },
            options: {
              env: envVars()
            },
            exitCode: [0,1,]
          },

          visual_regression_test: {
            command: (width,height) => `VERSION=${grunt.option('kobiton-version')} RES=${width}x${height} mocha --reporter=list --report-option output=./visual-regression-testing/logs/${width}x${height}.test --timeout 60000 \"./visual-regression-testing/*.js\" >> ./visual-regression-testing/logs/${width}x${height}.log 2>> ./visual-regression-testing/logs/${width}x${height}.error; exit 0`,
            options: {
              env: envVars()
            }
          },

          unit_test_node: {
            command: `NODE_PATH=./walta-app/app/lib/ PATH=./node_modules/.bin/:$PATH mocha --exit`,
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          build_key_ink: {
            command: "mono ./ink/inklecate/bin/Debug/netcoreapp2.1/inklecate.dll -o ./walta-taxonomy/walta/key.ink.json ./walta-taxonomy/walta/key.ink"
          },

          build: {
            command: build_app,
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

    grunt.registerTask("upload",function(platform,build_type) {
      const done = this.async();
      var ext = { "android": "apk", "ios": "ipa" }[platform];
      var appId = WATERBUG_APPID[platform];
      var filepath = `./builds/${build_type}/Waterbug.${ext}`;
      grunt.log.writeln(`Uploading ${filepath}`);
      Kobiton.uploadAppVersion(filepath, appId )
        .then( version => kobitonCurrentVersion = version ) 
        .then(done);
    });

    grunt.option('appium-retry-attempts', 2 );
    grunt.registerTask("launch", function(platform,build_type) {
      const done = this.async();
      getCapabilities(platform,true)
        .then( caps => {
            caps.skipLogCapture = false;
            return startAppium(caps) 
              .catch( (err) => {
                var attempts = parseInt(grunt.option('appium-retry-attempts'));
                if (  attempts > 0 ) {
                  grunt.option('appium-retry-attempts', attempts - 1);
                  grunt.log.writeln("Attempting to start appium server");
                  grunt.task.run('run:appium');
                  grunt.task.run(`launch:${platform}:${build_type}`);
                } else {
                  throw err;
                }
                })
              .then( done );
        });
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
      
      const retain = (platform === "android"? new RegExp(`(${_.map(levels, (l) => l.charAt(0)).join("|")}) +Ti\\w+ *: +`,"m"): new RegExp(`\\[(${levels.join("|")})\\]`,"m") );
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
    grunt.loadNpmTasks('grunt-parallel');
    grunt.loadNpmTasks('grunt-browserify');
  

    grunt.registerTask('test', function (platform) {
      grunt.task.run(`unit-test:${platform}`);
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });

    grunt.registerTask('end-to-end-test', function (platform) {
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
    });

    grunt.registerTask('get-kobiton-version', function() {
      var done = this.async();
      Kobiton.getLatestVersion(WATERBUG_APPID[grunt.option('platform')])
        .then( v => {
          grunt.log.writeln(`Using Kobiton app version ${v.id}`);
          grunt.option("kobiton-version", v.id );
          done();
        } )
        .catch( err => grunt.fail.fatal(err) );
    })

    grunt.registerTask('visual-regression-test', function () {
      var platform = grunt.option('platform');
      grunt.task.run(`newer:test_${platform}`);
      if ( grunt.option('kobiton') ) {
        grunt.task.run('get-kobiton-version');
      }
      /*var res = AVAILABLE_SCREEN_SIZES[platform][0];
      grunt.task.run(`exec:visual_regression_test:${res.width}:${res.height}`);*/
      grunt.task.run('parallel:visual_regression_test');
    });

    grunt.registerTask('acceptance-test', function (platform) {
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });

    
    grunt.registerTask('unit-test', function( platform ) {
      //grunt.task.run('run:appium');
      grunt.task.run(`newer:unit_test_${platform}`);
      grunt.task.run(`install:${platform}:unit-test`);
      grunt.task.run(`launch:${platform}:unit-test`);
      grunt.task.run(`output-logs:${platform}`);

    } );

    grunt.registerTask('unit-test-node', function( platform ) {
      grunt.task.run(`exec:unit_test_node`);


    } );

    grunt.registerTask('clean', ['exec:clean_dist','exec:clean'] );
    grunt.registerTask('preview', function() {
      var platform = grunt.option('platform');
      //grunt.task.run("run:appium");
      // It's often possible to get away without do a rebuild and relying on the file server 
      // to copy changes to the device. The quick option enables that.
      
      grunt.task.run(`newer:preview_${platform}`);
      if ( grunt.option('liveview') ) {
        grunt.task.run("exec:stop_live_view");
        grunt.task.run(`run:live_view_${platform}`);
      }
      grunt.task.run(`launch:${platform}:preview`);

      // the preview option here enters an infinite loop so that the log output
      // continues as changes are made during development
      grunt.task.run(`output-logs:${platform}:preview`);
    } );

    grunt.registerTask('preview-unit-test', function(platform) {
      grunt.task.run(`newer:preview_unit_test_${platform}`);
      if ( grunt.option('liveview') ) {
        grunt.task.run("exec:stop_live_view");
        grunt.task.run(`run:live_view_${platform}`);
      }
      grunt.task.run(`launch:${platform}:preview-unit-test`);
      grunt.task.run(`output-logs:${platform}:preview`);
    } );
  
    grunt.registerTask('release', function() {
      var platform = grunt.option('platform');
      grunt.task.run(`newer:release_${platform}`); 
    });

    grunt.registerTask('debug', function(platform) {
      grunt.task.run(`newer:debug_${platform}`); 
      grunt.task.run(`install:${platform}:debug`);
      grunt.task.run(`launch:${platform}:debug`);
      grunt.task.run(`output-logs:${platform}:preview`);
    });

    grunt.registerTask('emulate', function(platform) {
     // grunt.task.run("exec:stop_live_view");
     // grunt.task.run(`run:live_view_${platform}`);
      grunt.task.run(`exec:build:${platform}:emulate`); 
      grunt.task.run(`output-logs:${platform}:preview`);
    });

    grunt.registerTask('build-key-from-ink-json', function() {
      const key = KeyLoader.loadKey( './walta-app/app/assets/taxonomy/walta/', '/taxonomy/walta' );
      fs.writeFileSync( './walta-taxonomy/walta/key.json', CircularJSON.stringify(key) );
    });

    grunt.registerTask('build-key', function() {
      grunt.task.run("exec:build_key_ink");
      grunt.task.run("build-key-from-ink-json");
    });
    grunt.registerTask('build-html', ['browserify:mayfly']);
    grunt.registerTask('build-misc', ['build-key', 'build-html']);
  };