module.exports = function(grunt) {
const KobitonAPI = require("./features/support/kobiton");

    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const Module = require('module');
    // Make Titanium-style module paths (e.g. 'util/Logger') resolvable in Node.js
    process.env.NODE_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + ':' : '') + path.resolve(__dirname, 'walta-app/app/lib');
    Module._initPaths();
    const CircularJSON = require("circular-json");
    const KeyLoader = require("./walta-app/app/lib/logic/KeyLoaderInk");
    const { createMockCerdiServer } = require('./features/support/mock-cerdi-server');


    const APP_ID = "net.thewaterbug.waterbug";
    const APP_ACTIVITY = ".WaterbugActivity";
    const KEYSTORE = process.env.KEYSTORE || '/home/msharman/Documents/Business/thecodesharman.keystore';
    const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD || 'password';
    const KEYSTORE_SUBKEY = process.env.KEYSTORE_SUBKEY || 'thecodesharman';
    const DEVELOPER = process.env.DEVELOPER || "Michael Sharman (6RRED3LUUV)";
    const DEVELOPER_DEV = process.env.DEVELOPER_DEV || "Apple Development: Michael Sharman (ZG6HRCUR8Q)";
    const PROFILE_DIST = process.env.PROFILE_DIST;
    const PROFILE_ADHOC = process.env.PROFILE_ADHOC;
    const PROFILE_DEV = process.env.PROFILE_DEV;
    const DEVICE_ID = process.env.IOS_DEVICE_UDID;
    const ANDROID_DEVICE_SERIAL = process.env.ANDROID_DEVICE_SERIAL;
    const SIM_UDID = process.env.SIM_UDID;

    const WATERBUG_APPID = {
      "android": 257222,
      "ios": 257224
    }

    const SOURCES = [
      './walta-app/tiapp.xml',
      './walta-app/app/assets/**/*',
      './walta-app/app/**/*.js',
      './walta-app/app/**/*.xml',
      './walta-app/app/**/*.css',
      './walta-app/app/**/*.tss'
    ];

    function getLocalIP() {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return '127.0.0.1';
    }

    function createLiveViewLauncher(platform, { isSimulator = false, target, unitTest = false, buildOnly = true, noPrompt = true } = {}) {
      const args = ["serve", "-p", platform, "-d", "./walta-app", "--deploy-type", "development", "--liveview-ip", getLocalIP()];
      if (target) {
        args.push("--target", target);
      }
      if (platform === "ios" && !isSimulator) {
        if (DEVICE_ID) args.push("-C", DEVICE_ID);
        args.push("--target", "device", "-R", DEVELOPER_DEV, "-P", PROFILE_DEV);
      } else if (platform === "ios" && isSimulator) {
        if (SIM_UDID) args.push("-C", SIM_UDID);
      } else if (platform === "android" && isSimulator) {
        args.push("-C", "Medium_Phone_API_36.1", "--target", "emulator");
      } else if (platform === "android" && !isSimulator) {
        if (ANDROID_DEVICE_SERIAL) args.push("-C", ANDROID_DEVICE_SERIAL);
        args.push("--target", "device");
      }
      if (unitTest) args.push("--unit-test");
      if (buildOnly) args.push("--build-only");
      if (noPrompt) args.push("--no-prompt");
      // Dynamic import for ESM module
      return import("./build-utils/LiveViewLauncher.js").then(({ default: LiveViewLauncher }) =>
        new LiveViewLauncher({ command: "./node_modules/.bin/titanium", args, env: { ALLOY_PATH: "./node_modules/.bin/alloy" } })
      );
    }

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
          args.push( "--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
        } else if ( platform === "ios" ){
          args.push( "--deploy-type production", "--target dist-appstore", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_DIST}\"`);
        } else {
          throw new Error(`Unknown platform "${platform}"`);
        }
      }

      function test() {
        if ( platform === "android" ) {
          args.push( "--build-only","--deploy-type production", "--target dist-playstore", `--keystore ${KEYSTORE}`, `--store-password ${KEYSTORE_PASSWORD}`, `--alias ${KEYSTORE_SUBKEY}`); 
        } else if ( platform === "ios" ){
          args.push( "--build-only","--deploy-type production", `--device-id ${DEVICE_ID}`,"--target dist-adhoc", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_ADHOC}\"`);
        } else {
          throw new Error(`Unknown platform "${platform}"`);
        }
      }

      function dev() {
        if ( platform === "android" ) {
          args.push( "--build-only","--deploy-type development", "--target device" );
        } else if ( platform === "ios" ){
          args.push( "--build-only","--deploy-type development", "--target device", `-R  \"${DEVELOPER}\"`, `-P \"${PROFILE_DEV}\"`);
        } else {
          throw new Error(`Unknown platform "${platform}"`);
        }
      }

      function emulator() {
        if ( platform === "android" ) {
          args.push( "--build-only", "--deploy-type development", "--target emulator", '-C "Medium_Phone_API_36.1"');
        } else if ( platform === "ios" ){
          args.push( "--build-only", "--deploy-type development", "--target simulator", `-C ${SIM_UDID}` );
        } else {
          throw new Error(`Unknown platform "${platform}"`);
        }
      }


      if ( platform ) {
        args.push(`--platform ${platform}`);
      } else {
        throw new Error("please specify platform!");
      }

      // allow the application configuration to be overridden at 
      // build time.
      var overrideAppConfig = grunt.option('override-app-config');
      if ( overrideAppConfig ) {
        args.push(`--app-config=${overrideAppConfig}`);
      } else {
        switch(build_type) {
          case "release":
            args.push("--app-config", "production");
            break;
          default:
            args.push("--app-config", "mock");
            break;
        }
      }
      
      switch( build_type ) {
        case "debug":
          dev();
          post_cmds.push("mkdir -p ./builds/debug");
          if ( platform === "android" ) {
            post_cmds.push("cp ./walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk ./builds/debug/Waterbug.apk");
          } else {
            post_cmds.push("cp -r ./walta-app/build/iphone/build/Products/Debug-iphoneos/Waterbug.app ./builds/debug/Waterbug.app");
          }
          break;
        
        case "test":
          test();
          args.push("--output-dir builds/test");
          break;

        case "unit-test":
          if ( platform === "ios" ) {
            dev();
            post_cmds.push("mkdir -p ./builds/unit-test");
            post_cmds.push("cp -r ./walta-app/build/iphone/build/Products/Debug-iphoneos/Waterbug.app ./builds/unit-test/Waterbug.app");
          } else {
            test();
            args.push("--output-dir builds/unit-test");
          }
          args.push("--unit-test");
          break;

        case "test-sim":
          emulator();
          post_cmds.push("mkdir -p ./builds/test-sim");
          if ( platform === "android" ) {
            post_cmds.push("cp ./walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk ./builds/test-sim/Waterbug.apk");
          } else if ( platform === "ios" ) {
            post_cmds.push("cp -r ./walta-app/build/iphone/build/Products/Debug-iphonesimulator/Waterbug.app ./builds/test-sim/Waterbug.app");
          }
          break;

        case "unit-test-sim":
          emulator();
          args.push("--unit-test");
          post_cmds.push("mkdir -p ./builds/unit-test");
          if ( platform === "android" ) {
            args.push("--output-dir builds/unit-test");
            post_cmds.push("cp ./walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk ./builds/unit-test/Waterbug.apk");
          } else if ( platform === "ios" ) {
            post_cmds.push("cp -r ./walta-app/build/iphone/build/Products/Debug-iphonesimulator/Waterbug.app ./builds/unit-test/Waterbug.app");
          }
          break;

        case "release":
          production();
          args.push("--output-dir builds/release");
          break;


        default:
          throw new Error(`Unknown build "${build_type}" type!`)
      }
      if ( grunt.option('liveview') && !build_type.includes('liveview') ) {
        args.push("--liveview");
        args.push(`--liveview-host ${getLocalIP()}`);
      }
      
      var cmd = `./node_modules/.bin/titanium build ${args.join(" ")}`;
      post_cmds.forEach( c => cmd += " && " + c);
      return cmd;
    }


    function build_if_newer_options(platform,build_type) {
      const isSimBuild = build_type.includes("sim");
      const ext = platform === "android" ? "apk"
        : (build_type === "debug" || build_type === "unit-test" || isSimBuild) ? "app" : "ipa";
      // For .app bundles (directories), use Info.plist as the sentinel file
      // for mtime comparison — grunt-newer-explicit can't stat directories reliably.
      const dest = ext === "app"
        ? `./builds/${build_type}/Waterbug.app/Info.plist`
        : `./builds/${build_type}/Waterbug.${ext}`;
      const tasks = [];

      if ( ! grunt.option('skip-build') ) {
        // Regenerate tiapp.xml from template if it changed
        tasks.push('newer:tiapp');
        tasks.push(`exec:build:${platform}:${build_type}`);
        if ( grunt.option('kobiton') ) {
          tasks.push(`upload:${platform}:${build_type}`);
        }
      }
      return {
        src: SOURCES,
        dest: dest,
        options: { tasks: tasks }
      }
    }

    function envVars() {
      return {
        "PATH": `./node_modules/.bin/:${process.env.PATH}`,
        "PLATFORM": grunt.option('platform'),
        "HOST": grunt.option('kobiton') ? "kobiton" : "local",
        "SIMULATOR": grunt.option('simulator') ? "true" : "false"
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
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app && rm -rf ./walta-app/build/android/assets ./walta-app/build/android/app/build/intermediates/merged_assets ./walta-app/build/android/app/build/outputs',
            stdout: "inherit", stderr: "inherit"
          },

          clean_dist: {
            command: 'rm -r ./builds/{release,debug,test,unit-test,unit-test-sim}/*.{apk,ipa,aab,app}',
            exitCode: [ 0, 1 ],
            stdout: "inherit", stderr: "false",
            options: {
              shell: "/bin/bash"
            }
          },

          launch_android: {
            command: `adb shell am start -n ${APP_ID}/${APP_ACTIVITY}`
          },

          launch_ios: {
            command: `ios-deploy -m --bundle_id ${APP_ID}`
          },


          install_android: {
            command: function(build_type) { 
              return `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb install ./builds/${build_type}/Waterbug.apk`;
            }
          },

          install_ios: {
            command: function(build_type) { 
              let extension = "ipa";
              return `PATH=./node_modules/.bin/:$PATH ios-deploy --bundle ./builds/${build_type}/Waterbug.${extension}`;
            }, stdout: false, stderr: true
          },

          uninstall_android: {
            // see https://stackoverflow.com/questions/4709137/solution-to-install-failed-insufficient-storage-error-on-android
            command: `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb uninstall ${APP_ID} && ${process.env.ANDROID_SDK_ROOT}/platform-tools/adb shell "rm -rf /data/app/${APP_ID}-*"`,
            exitCode: [ 0, 1, 255 ]
          },

          uninstall_ios: {
            command: `PATH=./node_modules/.bin/:$PATH ios-deploy --uninstall_only --bundle_id ${APP_ID}`
          },

        /*  acceptance_test: {
            command: function(platform,option) {
              return `VERSION=${grunt.option('kobiton-version')} cucumber-js --tags "@only"`;
            },
            options: {
              env: envVars()
            },
            exitCode: [0,1]
          },*/

          end_to_end_test: {
            command: function() {
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
            command: `NODE_PATH=./walta-app/app/lib/ PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "test/*_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          contract_test: {
            command: `NODE_PATH=./walta-app/app/lib/ PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "contract-tests/*_spec.js"`,
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          build_test: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/unit/appconfig_spec.js" "build-tests/unit/stripsimincompatiblemodules_spec.js" "build-tests/unit/transpilefix_spec.js" "build-tests/unit/unittest_spec.js" "build-tests/unit/AppiumLauncher_spec.js" "build-tests/unit/LiveViewLauncher_spec.js" "build-tests/unit/CucumberLauncher_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          build_test_ios: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/unit/IosLauncher_spec.js" "build-tests/unit/IosSimulatorLauncher_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          build_test_android: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/unit/AndroidLauncher_spec.js" "build-tests/unit/AndroidEmulatorLauncher_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_test: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/integration/*.js"`,
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_test_ios_simulator: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/integration/IosSimulatorLauncher_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_test_android_emulator: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit "build-tests/integration/AndroidEmulatorLauncher_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          clean_integration_fixtures_android: {
            command: `rm -rf build-tests/integration/fixtures/HelloWorld-android/build build-tests/integration/fixtures/HelloWorld-android/*.apk`,
            stdout: "inherit", stderr: "inherit"
          },

          generate_tiapp: {
            command: 'sed "s/GOOGLE_MAPS_API_KEY_PLACEHOLDER/$GOOGLE_MAPS_API_KEY/" walta-app/tiapp.xml.template > walta-app/tiapp.xml',
            stdout: "inherit", stderr: "inherit"
          },

          clean_integration_fixtures_ios: {
            command: `rm -rf build-tests/integration/fixtures/HelloWorld-ios/build build-tests/integration/fixtures/HelloWorld-ios/sim-v* build-tests/integration/fixtures/HelloWorld-ios/v*`,
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_fixtures_android: {
            command: `bash build-tests/integration/fixtures/HelloWorld-android/build.sh`,
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_fixtures_ios: {
            command: `bash build-tests/integration/fixtures/HelloWorld-ios/build.sh`,
            stdout: "inherit", stderr: "inherit"
          },

          build_integration_fixtures_ios_simulator: {
            command: `bash build-tests/integration/fixtures/HelloWorld-ios/build.sh --simulator-only`,
            stdout: "inherit", stderr: "inherit"
          },
          build_key_ink: {
            command: "./ink/inklecate/bin/Release/netcoreapp3.1/osx-x64/inklecate -o ./walta-taxonomy/walta/key.ink.json ./walta-taxonomy/walta/key.ink"
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

          // Wipe Xcode's derived data for iphone so a device build doesn't
          // pick up stale simulator objects (e.g. missing Bugfender lib dir).
          clean_ios_device_build: {
            command: "rm -rf ./walta-app/build/iphone/build",
            exitCode: [0]
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
        },

        newer: {
          tiapp: {
            src: ['./walta-app/tiapp.xml.template'],
            dest: './walta-app/tiapp.xml',
            options: { tasks: ['exec:generate_tiapp'] }
          },

          unit_test_android: build_if_newer_options("android", "unit-test"),
          unit_test_ios: build_if_newer_options("ios", "unit-test"),

          unit_test_android_sim: build_if_newer_options("android", "unit-test-sim"),
          unit_test_ios_sim: build_if_newer_options("ios", "unit-test-sim"),

          test_android: build_if_newer_options("android", "test"),
          test_ios: build_if_newer_options("ios", "test"),

          test_sim_android: build_if_newer_options("android", "test-sim"),
          test_sim_ios: build_if_newer_options("ios", "test-sim"),

          debug_android: build_if_newer_options("android", "debug"),
          debug_ios: build_if_newer_options("ios", "debug"),


          release_android: build_if_newer_options("android", "release"),
          release_ios: build_if_newer_options("ios", "release"),


          build_integration_fixtures_android: {
            src: [
              'build-tests/integration/fixtures/HelloWorld-android/build.sh',
              'build-tests/integration/fixtures/HelloWorld-android/AndroidManifest.xml',
              'build-tests/integration/fixtures/HelloWorld-android/src/com/example/helloworld/MainActivity.java',
            ],
            dest: 'build-tests/integration/fixtures/HelloWorld-android/hello-v1.apk',
            options: { tasks: ['exec:build_integration_fixtures_android'] }
          },

          build_integration_fixtures_ios: {
            src: [
              'build-tests/integration/fixtures/HelloWorld-ios/build.sh',
              'build-tests/integration/fixtures/HelloWorld-ios/HelloWorld.xcodeproj/project.pbxproj',
              'build-tests/integration/fixtures/HelloWorld-ios/HelloWorld/AppDelegate.swift',
              'build-tests/integration/fixtures/HelloWorld-ios/HelloWorld/Info.plist',
            ],
            dest: 'build-tests/integration/fixtures/HelloWorld-ios/sim-v1/HelloWorld.app/HelloWorld',
            options: { tasks: ['exec:build_integration_fixtures_ios'] }
          }
        }
    });

    let _launcher = null;
    async function getLauncher(platform, isSimulator) {
      if (!_launcher) {
        if (platform === "android" && !isSimulator) {
          const { default: AndroidLauncher } = await import("./build-utils/AndroidLauncher.js");
          _launcher = new AndroidLauncher({ activity: APP_ACTIVITY, logTag: "TiAPI", logNoisePattern: /^Waterbug \d|^ti\.playservices:/ });
        } else if (platform === "ios" && !isSimulator) {
          const { default: IosLauncher } = await import("./build-utils/IosLauncher.js");
          _launcher = new IosLauncher({ appId: APP_ID, udid: DEVICE_ID });
        } else if (platform === "android" && isSimulator) {
          const { default: AndroidEmulatorLauncher } = await import("./build-utils/AndroidEmulatorLauncher.js");
          _launcher = new AndroidEmulatorLauncher({ activity: APP_ACTIVITY, logTag: "TiAPI", logNoisePattern: /^Waterbug \d|^ti\.playservices:/ });
        } else if (platform === "ios" && isSimulator) {
          const { default: IosSimulatorLauncher } = await import("./build-utils/IosSimulatorLauncher.js");
          _launcher = new IosSimulatorLauncher({ logProcessName: "Waterbug(TitaniumKit)", udid: SIM_UDID });
        } else {
          // AppiumLauncher kept for acceptance-test and visual-regression-test
          const { default: AppiumLauncher } = await import("./build-utils/AppiumLauncher.js");
          _launcher = new AppiumLauncher(platform, { isSimulator: isSimulator || false });
        }
      }
      return _launcher;
    }


    grunt.registerTask("cucumber", function () {
      const done = this.async();
      const tags = grunt.option('cucumber-tags') || '@only';
      const appiumOptions = {
        platform: grunt.option('platform'),
        isSimulator: !!grunt.option('simulator'),
        host: grunt.option('kobiton') ? 'kobiton' : 'local',
      };
      import("./build-utils/CucumberLauncher.js")
        .then(({ default: CucumberLauncher }) => new CucumberLauncher({ tags, appiumOptions }).run())
        .then((code) => {
          if (code !== 0) grunt.log.warn(`cucumber-js exited with code ${code}`);
          done();
        })
        .catch((err) => { grunt.fail.fatal(err); done(); });
    });

    grunt.registerTask("install", function(platform, build_type) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;

      // We get an appium session here because in the case of a simulator build
      // we need the emulator up and running.
      getLauncher(platform, isSimulator)
        .then(launcher => launcher.connect(false))
        .then(() => {
          grunt.task.run(`exec:uninstall_${platform}`);
          grunt.task.run(`exec:install_${platform}:${build_type}`);
          done();
        })
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

    function resolveAppPath(platform, buildType, isSimulator) {
      if (!buildType) return null;
      if (grunt.option('liveview-reuse') && buildType === 'unit-test-liveview') return null;

      // LiveView builds come from the Titanium build dir, not builds/
      if (buildType === 'unit-test-liveview') {
        if (platform === 'android') return './walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk';
        if (isSimulator) return './walta-app/build/iphone/build/Products/Debug-iphonesimulator/Waterbug.app';
        return './walta-app/build/iphone/build/Products/Debug-iphoneos/Waterbug.app';
      }

      // Everything else is packaged into builds/<buildType>/
      const ext = platform === 'android' ? 'apk'
        : ['debug', 'unit-test', 'test-sim'].includes(buildType) ? 'app'
        : 'ipa';
      return `./builds/${buildType}/Waterbug.${ext}`;
    }

    grunt.registerTask("launch", function(platform, buildType) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;
      const appPath = resolveAppPath(platform, buildType, isSimulator);

      if (!appPath) {
        grunt.log.writeln('No app path — launching existing installed app');
      }

      getLauncher(platform, isSimulator)
        .then(launcher => launcher.launch(APP_ID, appPath))
        .then(done)
        .catch(err => { grunt.fail.fatal(err); done(); });
    });

    grunt.registerTask("output-logs", function(platform, option) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;
      const idleTimeoutMs = 5 * 60 * 1000; // fail if no output for 5 minutes

      getLauncher(platform, isSimulator).then(launcher => {
        let stop;
        const logLevel = grunt.option('log-level') || 'info';
        let timer;
        const resetTimer = () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            if (stop) stop();
            grunt.fail.fatal(`output-logs idle for ${idleTimeoutMs / 1000}s — no log activity, assuming hang`);
            done();
          }, idleTimeoutMs);
        };
        resetTimer();

        stop = launcher.streamLogs(line => {
          resetTimer();
          if (/UNIT_TESTS_(PASSED|FAILED)/.test(line)) {
            clearTimeout(timer);
            if (option !== "preview") {
              stop();
              done();
            }
          } else {
            grunt.log.writeln(line);
          }
        }, { logLevel });
      });
    });

    grunt.registerTask("terminate", function(platform) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;
      getLauncher(platform, isSimulator)
        .then(launcher => launcher.terminate(APP_ID))
        .then(done);
    });

    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-newer-explicit");
    grunt.loadNpmTasks("grunt-then");
    grunt.loadNpmTasks('grunt-parallel');
    grunt.loadNpmTasks('grunt-browserify');
  

    grunt.registerTask('test', function () {
      var platform = grunt.option('platform');
      grunt.task.run(`unit-test:${platform}`);
      grunt.task.run(`newer:test_${platform}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
      grunt.task.run(`exec:acceptance_test:${platform}`);
    });


    grunt.registerTask('end-to-end-test', function () {
      var platform = grunt.option('platform');
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
      if ( grunt.option("all-sizes") ) {
        grunt.task.run('parallel:visual_regression_test');
      } else {
        var res = AVAILABLE_SCREEN_SIZES[platform][0];
        var width = res.width;
        var height = res.height;

        if ( grunt.option("select-size") ) {
          var sizeParts = grunt.option("select-size").split("x");
          width = sizeParts[0];
          height = sizeParts[1];

        }

        grunt.task.run(`exec:visual_regression_test:${width}:${height}`);
      }
      
    });

    grunt.registerTask('acceptance-test', function () {
      var platform = grunt.option('platform');
      const isSimulator = grunt.option('simulator') || false;
      const launchBuildType = isSimulator ? 'test-sim' : 'test';
      const newerTarget = isSimulator ? `test_sim_${platform}` : `test_${platform}`;
      grunt.task.run(`newer:${newerTarget}`);
      if ( ! grunt.option('kobiton') ) {
        if ( grunt.option('liveview') ) {
          const done = this.async();
          const reuseServer = grunt.option('reuse-server');
          createLiveViewLauncher(platform, { isSimulator }).then(async (liveview) => {
            if (reuseServer) {
              const reused = await liveview.ensureRunning();
              if (reused) {
                grunt.log.writeln('LiveView server already running, reusing existing session');
              }
            } else {
              await liveview.stop();
              await liveview.start();
            }
            grunt.task.run(`launch:${platform}:${launchBuildType}`);
            grunt.task.run("cucumber");
            done();
          }).catch(err => { grunt.fail.fatal(err); done(); });
          return;
        }

        grunt.task.run(`launch:${platform}:${launchBuildType}`);
      }
      grunt.task.run("cucumber");
    });

    
    grunt.registerTask('unit-test', function( ) {
      var platform = grunt.option('platform');
      var isSimulator = grunt.option('simulator');
      var preview = grunt.option('preview');

      if ( grunt.option('liveview') ) {
        const done = this.async();
        const reuseServer = grunt.option('reuse-server');
        createLiveViewLauncher(platform, { isSimulator, unitTest: true }).then(async (liveview) => {
          if (reuseServer) {
            const reused = await liveview.ensureRunning();
            if (reused) {
              grunt.log.writeln('LiveView server already running, reusing existing session');
              grunt.option('liveview-reuse', true);
            }
          } else {
            await liveview.stop();
            await liveview.start();
          }

          let mockServer = createMockCerdiServer();
          mockServer.makeMockSample();

          grunt.task.run(`launch:${platform}:unit-test-liveview`);
          grunt.task.run(`output-logs:${platform}:${preview?"preview":""}`);
          grunt.task.run(`terminate:${platform}`);
          mockServer.shutdown();
          done();
        }).catch(err => { grunt.fail.fatal(err); done(); });
      } else {
        grunt.task.run('clean');
        grunt.task.run(`newer:unit_test_${platform}${isSimulator?"_sim":""}`);

        let mockServer = createMockCerdiServer();
        mockServer.makeMockSample();

        grunt.task.run(`launch:${platform}:unit-test`);
        grunt.task.run(`output-logs:${platform}:${preview?"preview":""}`);
        grunt.task.run(`terminate:${platform}`);
        mockServer.shutdown();
      }
    } );

    grunt.registerTask('unit-test-node', function() {
      grunt.task.run(`exec:unit_test_node`);
    } );

    grunt.registerTask('contract-test', function() {
      grunt.task.run(`exec:contract_test`);
    } );

    grunt.registerTask('build-test', function() {
      grunt.task.run(`exec:build_test`);
    } );

    grunt.registerTask('build-test-ios', function() {
      grunt.task.run(`exec:build_test_ios`);
    } );

    grunt.registerTask('build-test-android', function() {
      grunt.task.run(`exec:build_test_android`);
    } );

    grunt.registerTask('build-integration-test-ios-simulator', function() {
      grunt.task.run('exec:build_integration_fixtures_ios_simulator');
      grunt.task.run(`exec:build_integration_test_ios_simulator`);
    } );

    grunt.registerTask('build-integration-test-android-emulator', function() {
      grunt.task.run('newer:build_integration_fixtures_android');
      grunt.task.run(`exec:build_integration_test_android_emulator`);
    } );

    grunt.registerTask('build-integration-test', function() {
      grunt.task.run('newer:build_integration_fixtures_android');
      grunt.task.run('newer:build_integration_fixtures_ios');
      grunt.task.run(`exec:build_integration_test`);
    } );

    grunt.registerTask('build-integration-fixtures', function() {
      grunt.task.run(`exec:build_integration_fixtures_android`);
      grunt.task.run(`exec:build_integration_fixtures_ios`);
    } );

    grunt.registerTask('clean-integration-fixtures', ['exec:clean_integration_fixtures_android', 'exec:clean_integration_fixtures_ios']);
    grunt.registerTask('clean', ['exec:clean_dist','exec:clean'] );


    grunt.registerTask('release', function() {
      var platform = grunt.option('platform');
      grunt.task.run(`newer:release_${platform}`);
    });

    grunt.registerTask('debug', function() {
      var platform = grunt.option('platform');
      const isSimulator = grunt.option('simulator') || false;
      if (grunt.option('liveview')) {
        const done = this.async();
        const reuseServer = grunt.option('reuse-server');
        createLiveViewLauncher(platform, { isSimulator }).then(async (liveview) => {
          if (reuseServer) {
            const reused = await liveview.ensureRunning();
            if (reused) {
              grunt.log.writeln('LiveView server already running, reusing existing session');
              grunt.option('liveview-reuse', true);
            }
          } else {
            await liveview.stop();
            await liveview.start();
          }
          grunt.task.run(`launch:${platform}:unit-test-liveview`);
          grunt.task.run(`output-logs:${platform}:preview`);
          done();
        }).catch(err => { grunt.fail.fatal(err); done(); });
      } else {
        grunt.task.run(`newer:debug_${platform}`);
        grunt.task.run(`launch:${platform}:debug`);
        grunt.task.run(`output-logs:${platform}:preview`);
      }
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