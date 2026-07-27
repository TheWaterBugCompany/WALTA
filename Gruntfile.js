module.exports = function(grunt) {

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
      './walta-app/app/**/*.tss',
      './plugins/**/*.js'
    ];

    function mochaGrepFlag() {
      const grep = grunt.option('grep');
      return grep ? ` --grep ${JSON.stringify(grep)}` : '';
    }

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

    // The serial of a running emulator (emulator-NNNN), or undefined if none is up.
    function resolveEmulatorSerial() {
      const { execFileSync } = require('child_process');
      const adbBin = process.env.ANDROID_SDK_ROOT ? `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb` : 'adb';
      try {
        const out = execFileSync(adbBin, ['devices'], { encoding: 'utf8' });
        const line = out.split('\n').find((l) => /^emulator-\d+\s+device\b/.test(l));
        return line ? line.split(/\s+/)[0] : undefined;
      } catch (e) {
        return undefined;
      }
    }

    // For `--simulator` Android runs, pin all tooling to the running emulator.
    // A profile-level ANDROID_DEVICE_SERIAL (Titanium) / ANDROID_SERIAL (adb,
    // Appium) pins the toolchain to a physical device, which overrides
    // `--target emulator` and makes the build, install, launch and Appium
    // session land on (or hang waiting for) the phone. Mutating process.env
    // here propagates to every child process — build, install, `am start`,
    // logcat and cucumber's Appium session — so it works regardless of
    // --liveview. When no emulator is up, clear the pins so `--target emulator`
    // can boot one. No-op on iOS or device builds.
    function pinAndroidToEmulator(platform, isSimulator) {
      if (platform !== 'android' || !isSimulator) return;
      const serial = resolveEmulatorSerial();
      if (serial) {
        process.env.ANDROID_DEVICE_SERIAL = serial;
        process.env.ANDROID_SERIAL = serial;
      } else {
        delete process.env.ANDROID_DEVICE_SERIAL;
        delete process.env.ANDROID_SERIAL;
      }
    }

    function createLiveViewLauncher(platform, { isSimulator = false, target, unitTest = false, buildOnly = true, noPrompt = true } = {}) {
      const args = ["serve", "-p", platform, "-d", "./walta-app", "--deploy-type", "development", "--liveview-ip", getLocalIP()];
      const env = { ALLOY_PATH: "./node_modules/.bin/alloy" };
      if (target) {
        args.push("--target", target);
      }
      if (platform === "ios" && !isSimulator) {
        if (DEVICE_ID) args.push("-C", DEVICE_ID);
        args.push("--target", "device", "-R", DEVELOPER_DEV, "-P", PROFILE_DEV);
      } else if (platform === "ios" && isSimulator) {
        if (SIM_UDID) args.push("-C", SIM_UDID);
      } else if (platform === "android" && isSimulator) {
        // Emulator pinning (ANDROID_DEVICE_SERIAL/ANDROID_SERIAL) is handled by
        // pinAndroidToEmulator() in the task entry, so it applies to the build,
        // install and Appium session too — not just this serve subprocess.
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
        new LiveViewLauncher({ command: "./node_modules/.bin/titanium", args, env })
      );
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
        args.push("--app-config", overrideAppConfig);
      } else {
        switch(build_type) {
          case "release":
            args.push("--app-config", "production");
            break;
          default:
            args.push("--app-config", "test");
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
            // `cp -r src dst` on macOS nests src INSIDE dst when dst already
            // exists (creating dst/Waterbug.app/Waterbug.app) — leaving the
            // outer dst/Waterbug.app files stale. Wipe dst first so the
            // copy fully replaces the previous build.
            post_cmds.push("rm -rf ./builds/debug/Waterbug.app");
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
            post_cmds.push("rm -rf ./builds/unit-test/Waterbug.app");
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
            post_cmds.push("rm -rf ./builds/test-sim/Waterbug.app");
            post_cmds.push("cp -r ./walta-app/build/iphone/build/Products/Debug-iphonesimulator/Waterbug.app ./builds/test-sim/Waterbug.app");
          }
          break;

        case "release":
          production();
          args.push("--output-dir builds/release");
          break;


        default:
          throw new Error(`Unknown build "${build_type}" type!`)
      }
      // `test-sim` (acceptance-test) starts its own LiveView server before
      // this inline build runs; appending --liveview here would start a
      // second server inside `titanium build` that never exits, deadlocking
      // the wrapper shell. Other build types are unaffected.
      if ( grunt.option('liveview') && !build_type.includes('liveview') && build_type !== 'test-sim' ) {
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
      exec: {
          mock_server: {
            command: 'node mock-server',
            stdout: "inherit", stderr: "inherit"
          },
          clean: {
            // Also nuke walta-app/Resources/ — Alloy stages compiled JS / CFG.js
            // there and `titanium clean` leaves it behind, so a stale CFG.js can
            // outlive a clean if Alloy fails to invalidate after a config.json
            // change (bit us once when a palette refactor in main hadn't picked
            // up locally).
            command: './node_modules/.bin/titanium clean --project-dir ./walta-app && rm -rf ./walta-app/build/android/assets ./walta-app/build/android/app/build/intermediates/merged_assets ./walta-app/build/android/app/build/outputs ./walta-app/Resources',
            stdout: "inherit", stderr: "inherit"
          },

          clean_dist: {
            command: 'rm -r ./builds/{release,debug,test,test-sim,unit-test}/*.{apk,ipa,aab,app}',
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

          end_to_end_test: {
            // setup.js holds the Mocha root hooks (mock server + Appium
            // connect + reset); list it first, then run the *-test.js specs.
            command: function() {
              return `mocha --timeout 120000${mochaGrepFlag()} ./end-to-end-testing/setup.js "./end-to-end-testing/*-test.js"`;
            },
            options: {
              // Merge over process.env so the mocha child inherits SIM_UDID,
              // WDA_DERIVED_DATA_PATH, ANDROID_SDK_ROOT, MOCK_CERDI_URL etc.
              // (envVars() alone would replace the env and drop them).
              env: { ...process.env, ...envVars() }
            },
            exitCode: [0,1,]
          },

          unit_test_node: {
            command: () => `NODE_PATH=./walta-app/app/lib/ PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit${mochaGrepFlag()} "test/**/*_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          contract_test: {
            command: () => `NODE_PATH=./walta-app/app/lib/ PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit${mochaGrepFlag()} "contract-tests/*_spec.js"`,
            exitCode: [0,1],
            stdout: "inherit", stderr: "inherit"
          },

          build_test: {
            command: () => `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 60000 --exit${mochaGrepFlag()} "build-tests/unit/*_spec.js"`,
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

          acceptance_preflight_test_ios_simulator: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 120000 --exit "build-tests/integration/AppiumLauncherIos_spec.js"`,
            stdout: "inherit", stderr: "inherit"
          },

          acceptance_preflight_test_android_emulator: {
            command: `NODE_OPTIONS=--experimental-vm-modules PATH=./node_modules/.bin/:$PATH mocha --timeout 120000 --exit "build-tests/integration/AppiumLauncherAndroid_spec.js"`,
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

        newer: {
          tiapp: {
            src: ['./walta-app/tiapp.xml.template'],
            dest: './walta-app/tiapp.xml',
            options: { tasks: ['exec:generate_tiapp'] }
          },

          unit_test_android: build_if_newer_options("android", "unit-test"),
          unit_test_ios: build_if_newer_options("ios", "unit-test"),

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
          const { default: AppiumLauncher } = await import("./build-utils/AppiumLauncher.js");
          _launcher = new AppiumLauncher(platform, { isSimulator: isSimulator || false });
        }
      }
      return _launcher;
    }


    grunt.registerTask("cucumber", function () {
      const done = this.async();
      const platform = grunt.option('platform');
      // Default excludes @skip everywhere; each platform also excludes its own
      // @skip-<platform> tag — e.g. @skip-ios for the form-login scenario whose
      // iOS "Save Password?" sheet leaks across scenarios (WB-87), and
      // @skip-android for the iOS-springboard app-badge checks (Android badge
      // is WB-10b).
      const tags = grunt.option('cucumber-tags')
        || (platform === 'ios' ? 'not @skip and not @skip-ios' : 'not @skip and not @skip-android');
      const name = grunt.option('grep') || null;
      const appiumOptions = {
        platform,
        isSimulator: !!grunt.option('simulator'),
      };
      import("./build-utils/CucumberLauncher.js")
        .then(({ default: CucumberLauncher }) => new CucumberLauncher({ tags, name, appiumOptions }).run())
        .then((code) => {
          if (code !== 0) {
            // WB-94: propagate the launcher's specific exit code so the
            // CI shell can distinguish a real test failure (cucumber-js's
            // own 1/2 codes) from an infrastructure failure that never
            // reached tests (EX_TEMPFAIL = 75). `done(false)` would
            // collapse everything to grunt's generic non-zero, losing
            // the signal CI needs to decide whether to retry.
            grunt.log.error(`cucumber-js exited with code ${code}`);
            process.exit(code);
          }
          done();
        })
        .catch((err) => { grunt.fail.fatal(err); done(false); });
    });

    // Wipe persistent app state (Ti.App.Properties / NSUserDefaults / sqlite)
    // so the next launch starts clean. Android: `pm clear` keeps the app
    // installed and clears /data. iOS sim: no `pm clear` equivalent, so
    // uninstall + reinstall the freshly-built bundle. iOS device is not
    // supported (use `grunt install` for that path).
    grunt.registerTask("reset-app", function(platform, buildType) {
      const isSimulator = grunt.option('simulator') || false;
      const { execFileSync } = require('child_process');
      if (platform === 'android') {
        const adbBin = process.env.ANDROID_SDK_ROOT
          ? `${process.env.ANDROID_SDK_ROOT}/platform-tools/adb`
          : 'adb';
        execFileSync(adbBin, ['shell', 'pm', 'clear', APP_ID], { stdio: 'inherit' });
      } else if (platform === 'ios' && isSimulator) {
        if (!SIM_UDID) grunt.fail.fatal('SIM_UDID environment variable must be set');
        const appPath = resolveAppPath(platform, buildType, isSimulator);
        // simctl uninstall is a no-op (exits 0) if the app isn't installed.
        execFileSync('xcrun', ['simctl', 'uninstall', SIM_UDID, APP_ID], { stdio: 'inherit' });
        execFileSync('xcrun', ['simctl', 'install', SIM_UDID, appPath], { stdio: 'inherit' });
      } else if (platform === 'ios') {
        if (!DEVICE_ID) grunt.fail.fatal('IOS_DEVICE_UDID must be set to --reset a physical iOS device');
        // devicectl uninstall errors when the app isn't installed; swallow
        // it so --reset works on a fresh device too. The subsequent launch
        // task reinstalls.
        try {
          execFileSync('xcrun', ['devicectl', 'device', 'uninstall', 'app', '--device', DEVICE_ID, APP_ID], { stdio: 'inherit' });
        } catch (_) {
          grunt.log.writeln('App not installed on device — nothing to uninstall');
        }
      }
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


    function isLiveViewBuildType(buildType) {
      return buildType === 'unit-test-liveview' || buildType === 'debug-liveview';
    }

    function resolveAppPath(platform, buildType, isSimulator) {
      if (!buildType) return null;
      if (grunt.option('liveview-reuse') && isLiveViewBuildType(buildType)) return null;

      // LiveView builds come from the Titanium build dir, not builds/
      // — same raw output for both unit-test-liveview and debug-liveview;
      // the only difference is whether `unit_test=true` is set as a launch
      // arg (see launch task below).
      if (isLiveViewBuildType(buildType)) {
        if (platform === 'android') return './walta-app/build/android/app/build/outputs/apk/debug/app-debug.apk';
        if (isSimulator) return './walta-app/build/iphone/build/Products/Debug-iphonesimulator/Waterbug.app';
        return './walta-app/build/iphone/build/Products/Debug-iphoneos/Waterbug.app';
      }

      // WB-51: simulator builds share one canonical artifact regardless of
      // buildType — `unit-test`/`test-sim` produce identical binaries since
      // WB-25's runtime dispatcher decides modes via a launch arg.
      if (isSimulator) {
        return platform === 'android'
          ? './builds/test-sim/Waterbug.apk'
          : './builds/test-sim/Waterbug.app';
      }

      // Device packages still live under builds/<buildType>/
      const ext = platform === 'android' ? 'apk'
        : ['debug', 'unit-test'].includes(buildType) ? 'app'
        : 'ipa';
      return `./builds/${buildType}/Waterbug.${ext}`;
    }

    // Build the runtime test-config argv that gets forwarded to the on-device
    // spec runner. Android: intent extras via `am start --es/--ez`. iOS:
    // NSUserDefaults-style argv via `simctl launch` / `devicectl ...`.
    // WB-76: also consumed by the `output-logs` task so streamLogs can replay
    // them when it relaunches the app with `devicectl --console`.
    function computeLaunchArgs(buildType) {
      const launchArgs = {};
      const grep = grunt.option('grep');
      if (grep) launchArgs.test_grep = grep;
      if (grunt.option('manual')) launchArgs.test_manual = true;
      // WB-25: the index.js dispatcher reads `unit_test` to choose between
      // the real app and the on-device test runner. Set it whenever we're
      // launching the unit-test build path so the dispatcher routes to
      // UnitTest.js.
      if (buildType === 'unit-test' || buildType === 'unit-test-liveview') {
        // The visual-regression runner reuses the test-sim binary but routes to
        // VisualCapture.js instead of the mocha runner (index.js dispatches on
        // this arg). `--grep` doubles as the screen filter via test_grep above.
        if (grunt.option('visual')) {
          launchArgs.visual_capture = true;
        } else {
          launchArgs.unit_test = true;
        }
      }
      return launchArgs;
    }

    grunt.registerTask("launch", function(platform, buildType) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;
      const appPath = resolveAppPath(platform, buildType, isSimulator);

      if (!appPath) {
        grunt.log.writeln('No app path — launching existing installed app');
      }

      const launchArgs = computeLaunchArgs(buildType);
      const hasLaunchArgs = Object.keys(launchArgs).length > 0;
      if (hasLaunchArgs) {
        grunt.log.writeln(`Forwarding launch args to test runner: ${JSON.stringify(launchArgs)}`);
      }

      getLauncher(platform, isSimulator)
        .then(launcher => launcher.launch(APP_ID, appPath, hasLaunchArgs ? launchArgs : undefined))
        .then(done)
        .catch(err => { grunt.fail.fatal(err); done(); });
    });

    grunt.registerTask("output-logs", function(platform, option) {
      const done = this.async();
      const isSimulator = grunt.option('simulator') || false;
      // Overridable so the hang path can be exercised without a 5-minute wait.
      const idleTimeoutMs = (grunt.option('idle-timeout') || 5 * 60) * 1000;

      Promise.all([
        getLauncher(platform, isSimulator),
        import("./build-utils/parseUnitTestResult.js")
      ]).then(([launcher, { parseUnitTestResult }]) => {
        let stop;
        const logLevel = grunt.option('log-level') || 'info';
        let timer;
        const resetTimer = () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(async () => {
            if (stop) stop();
            // The stream is filtered to the Titanium tag, so an idle hang leaves
            // no evidence of whether the app crashed, never started, or simply
            // said nothing. Capture the wider state before failing (WB-196).
            const report = typeof launcher.captureDiagnostics === "function"
              ? await launcher.captureDiagnostics(APP_ID).catch(err => `diagnostics failed: ${err.message}`)
              : `${launcher.constructor.name} has no captureDiagnostics()`;
            grunt.log.writeln(`No log activity for ${idleTimeoutMs / 1000}s. Device state:\n${report}`);
            grunt.fail.fatal(`output-logs idle for ${idleTimeoutMs / 1000}s — no log activity, assuming hang`);
            done();
          }, idleTimeoutMs);
        };
        resetTimer();

        stop = launcher.streamLogs(line => {
          resetTimer();
          const result = parseUnitTestResult(line);
          if (result) {
            // Print the marker line so it shows up in CI logs.
            grunt.log.writeln(line);
            clearTimeout(timer);
            if (option !== "preview") {
              stop();
              if (result === "failed") {
                // Exit 2 = deterministic test failure. The CI retry
                // wrapper keys off this code to skip its retry. The
                // process.once('exit') handler registered in the
                // `unit-test` task still fires here, so mockServer is
                // shut down cleanly. See WB-48.
                process.exit(2);
              }
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
    grunt.loadNpmTasks("grunt-newer-explicit");
    grunt.loadNpmTasks("grunt-then");
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
      const isSimulator = grunt.option('simulator') || false;
      pinAndroidToEmulator(platform, isSimulator);
      const launchBuildType = isSimulator ? 'test-sim' : 'test';
      const newerTarget = isSimulator ? `test_sim_${platform}` : `test_${platform}`;
      // --skip-build: CI consumes the prebuilt artifact (WB-51), so don't
      // rebuild (and don't require the Titanium SDK at runtime).
      if (!grunt.option('skip-build')) {
        grunt.task.run(`newer:${newerTarget}`);
      }
      // Install + launch via simctl/adb before the mocha process connects
      // Appium — mirrors how acceptance-test launches before cucumber.
      grunt.task.run(`launch:${platform}:${launchBuildType}`);
      grunt.task.run(`exec:end_to_end_test:${platform}`);
    });

    grunt.registerTask('acceptance-test', function () {
      var platform = grunt.option('platform');
      const isSimulator = grunt.option('simulator') || false;
      pinAndroidToEmulator(platform, isSimulator);
      const launchBuildType = isSimulator ? 'test-sim' : 'test';
      const newerTarget = isSimulator ? `test_sim_${platform}` : `test_${platform}`;
      grunt.task.run(`newer:${newerTarget}`);
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
      grunt.task.run("cucumber");
    });

    
    grunt.registerTask('unit-test', function( ) {
      var platform = grunt.option('platform');
      var isSimulator = grunt.option('simulator');
      pinAndroidToEmulator(platform, isSimulator);
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
          // Cleanup runs at process exit — including the process.exit(2)
          // path triggered from `output-logs` on UNIT_TESTS_FAILED. See
          // WB-48. `grunt.task.run` only queues; doing shutdown() inline
          // here would close the port before the queued tasks even start.
          process.once('exit', () => mockServer.shutdown());

          grunt.task.run(`launch:${platform}:unit-test-liveview`);
          grunt.task.run(`output-logs:${platform}:${preview?"preview":""}`);
          // Skip teardown in --manual mode so the screen-under-test stays
          // visible on the device after the spec finishes.
          if (!grunt.option('manual')) {
            grunt.task.run(`terminate:${platform}`);
          }
          done();
        }).catch(err => { grunt.fail.fatal(err); done(); });
      } else {
        // Clean only makes sense as a "fresh build" guarantee — when
        // --skip-build is set (e.g. CI consuming a prebuilt artifact),
        // skip clean too so we don't need the Titanium SDK at runtime
        // and don't clobber the prebuilt outputs (WB-51).
        if (!grunt.option('skip-build')) {
          grunt.task.run('clean');
        }
        // Simulator builds share the canonical test-sim binary with the
        // acceptance suite (WB-51). Device unit-test builds keep their
        // own newer-target since the device path is distinct.
        grunt.task.run(`newer:${isSimulator ? `test_sim_${platform}` : `unit_test_${platform}`}`);

        let mockServer = createMockCerdiServer();
        mockServer.makeMockSample();
        // See above — cleanup at process exit.
        process.once('exit', () => mockServer.shutdown());

        grunt.task.run(`launch:${platform}:unit-test`);
        grunt.task.run(`output-logs:${platform}:${preview?"preview":""}`);
        // Skip teardown in --manual mode so the screen-under-test stays
        // visible on the device after the spec finishes.
        if (!grunt.option('manual')) {
          grunt.task.run(`terminate:${platform}`);
        }
      }
    } );

    // Visual regression: capture every screen on device via the VisualCapture
    // run mode (no Appium — it only cares what the rendered layout looks like),
    // pull the PNGs, and diff them against committed baselines. Mirrors the
    // unit-test task's build/launch shape; `--visual` routes computeLaunchArgs to
    // the visual_capture arg. Flags: --update (refresh baselines), --grep (one
    // screen), --device=<label> (baseline set), --advisory (don't fail on diff).
    grunt.registerTask('visual-test', function () {
      const platform = grunt.option('platform');
      const isSimulator = grunt.option('simulator');
      pinAndroidToEmulator(platform, isSimulator);
      grunt.option('visual', true);

      if (grunt.option('liveview')) {
        const done = this.async();
        const reuseServer = grunt.option('reuse-server');
        createLiveViewLauncher(platform, { isSimulator, unitTest: true }).then(async (liveview) => {
          if (reuseServer) {
            const reused = await liveview.ensureRunning();
            if (reused) { grunt.log.writeln('LiveView server already running, reusing existing session'); }
          } else {
            await liveview.stop();
            await liveview.start();
          }
          grunt.task.run(`launch:${platform}:unit-test-liveview`);
          grunt.task.run(`visual-collect:${platform}`);
          if (!grunt.option('manual')) { grunt.task.run(`terminate:${platform}`); }
          done();
        }).catch(err => { grunt.fail.fatal(err); done(); });
      } else {
        if (!grunt.option('skip-build')) { grunt.task.run('clean'); }
        grunt.task.run(`newer:${isSimulator ? `test_sim_${platform}` : `unit_test_${platform}`}`);
        grunt.task.run(`launch:${platform}:unit-test`);
        grunt.task.run(`visual-collect:${platform}`);
        if (!grunt.option('manual')) { grunt.task.run(`terminate:${platform}`); }
      }
    });

    // Streams the device log until the capture runner signals done, pulls the
    // PNGs, and diffs them against the baseline set. Runs after `launch`.
    grunt.registerTask('visual-collect', function (platform) {
      const done = this.async();
      const path = require('path');
      const isSimulator = grunt.option('simulator');
      const update = grunt.option('update');
      const device = grunt.option('device') || 'local';
      const actualDir = path.join('builds', 'visual', platform, device, 'actual');
      const baselineDir = path.join('visual', 'baselines', platform, device);
      const outDir = path.join('builds', 'visual', platform, device, 'report');
      const captureTimeoutMs = (grunt.option('capture-timeout') || 180) * 1000;

      Promise.all([
        getLauncher(platform, isSimulator),
        import('./build-utils/parseVisualCaptureResult.js'),
        import('./build-utils/visual/compareRun.js'),
      ]).then(async ([launcher, { parseVisualCaptureResult }, { compareRun }]) => {
        const marker = await new Promise((resolve, reject) => {
          let stop;
          const timer = setTimeout(() => {
            if (stop) stop();
            reject(new Error(`visual capture timed out after ${captureTimeoutMs / 1000}s with no VISUAL_CAPTURE_DONE`));
          }, captureTimeoutMs);
          stop = launcher.streamLogs((line) => {
            grunt.log.writeln(line);
            const result = parseVisualCaptureResult(line);
            if (result) { clearTimeout(timer); stop(); resolve(result); }
          }, { logLevel: 'info' });
        });
        if (marker.status === 'failed') { throw new Error(`on-device capture failed: ${marker.message}`); }
        grunt.log.writeln(`Captured ${marker.count} screen(s); pulling from device…`);

        if (typeof launcher.pullCapturedScreenshots !== 'function') {
          throw new Error(`${launcher.constructor.name} does not implement pullCapturedScreenshots yet`);
        }
        // Start from a clean actual dir so a screen dropped from the manifest
        // doesn't leave a stale capture behind that reads as an unexpected diff.
        require('fs').rmSync(actualDir, { recursive: true, force: true });
        // iOS resolves the dir from the app container via subdir; Android needs
        // the device-side path the runner reported (marker.dir).
        await launcher.pullCapturedScreenshots(APP_ID, { subdir: 'visual', destDir: actualDir, deviceDir: marker.dir });

        const run = await compareRun({ baselineDir, actualDir, outDir, update });
        for (const res of run.results) {
          grunt.log.writeln(`  ${res.status.padEnd(8)} ${res.name}${res.diffPixels != null ? ` (${res.diffPixels}px)` : ''}`);
        }

        if (update) {
          grunt.log.writeln(`Baselines written to ${baselineDir}`);
        } else if (run.pass) {
          grunt.log.writeln('All screens match baseline.');
        } else if (grunt.option('advisory')) {
          grunt.log.writeln(`Visual diffs found (report in ${outDir}) — advisory mode, not failing the build.`);
        } else {
          grunt.fail.fatal(`Visual regression: screens differ from baseline. Diff images in ${outDir}.`);
        }
        done();
      }).catch(err => { grunt.fail.fatal(err); done(); });
    });

    grunt.registerTask('unit-test-node', ['exec:unit_test_node']);
    grunt.registerTask('contract-test',  ['exec:contract_test']);
    grunt.registerTask('build-test',     ['exec:build_test']);

    grunt.registerTask('build-integration-test-ios-simulator', function() {
      grunt.task.run('exec:build_integration_fixtures_ios_simulator');
      grunt.task.run(`exec:build_integration_test_ios_simulator`);
    } );

    grunt.registerTask('build-integration-test-android-emulator', function() {
      grunt.task.run('newer:build_integration_fixtures_android');
      grunt.task.run(`exec:build_integration_test_android_emulator`);
    } );

    grunt.registerTask('acceptance-preflight-test-ios-simulator', function() {
      grunt.task.run('exec:build_integration_fixtures_ios_simulator');
      grunt.task.run('exec:acceptance_preflight_test_ios_simulator');
    } );

    grunt.registerTask('acceptance-preflight-test-android-emulator', function() {
      grunt.task.run('newer:build_integration_fixtures_android');
      grunt.task.run('exec:acceptance_preflight_test_android_emulator');
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
      pinAndroidToEmulator(platform, isSimulator);
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
          grunt.task.run(`launch:${platform}:debug-liveview`);
          grunt.task.run(`output-logs:${platform}:preview`);
          done();
        }).catch(err => { grunt.fail.fatal(err); done(); });
      } else {
        // The `debug` build type targets device (signed dev build); `test-sim`
        // targets the simulator. Same dev build, different deploy target —
        // see Gruntfile.js:151 (dev) vs :161 (emulator). Without this branch,
        // `--simulator debug` installs the device binary on the sim and fails
        // with EXEC_BAD_FORMAT.
        const buildType = isSimulator ? 'test-sim' : 'debug';
        const newerTarget = isSimulator ? `test_sim_${platform}` : `debug_${platform}`;
        grunt.task.run(`newer:${newerTarget}`);
        if (grunt.option('reset')) {
          grunt.task.run(`reset-app:${platform}:${buildType}`);
        }
        grunt.task.run(`launch:${platform}:${buildType}`);
        grunt.task.run(`output-logs:${platform}:preview`);
      }
    });


    grunt.registerTask('build-key-from-ink', function() {
      const key = KeyLoader.loadKey( './walta-taxonomy/walta/', '/taxonomy/walta' );
      fs.writeFileSync( './walta-taxonomy/walta/key.json', CircularJSON.stringify(key) );
    });

    grunt.registerTask('verify-media', function() {
      const key = KeyLoader.loadKey( './walta-taxonomy/walta/', '/taxonomy/walta' );
      const refs = [].concat(
        key.findAllMedia( 'mediaUrls', false ),
        key.findAllMedia( 'bluebug' )
      );
      const missing = refs.filter( ({ url }) => url && !fs.existsSync( url.replace('/taxonomy/', 'walta-taxonomy/') ) );
      if ( missing.length ) {
        missing.forEach( ({ url, taxon }) => grunt.log.error(`missing media: ${url} (referenced by ${taxon.id || taxon.taxonId || '?'})`));
        grunt.fail.warn(`${missing.length} media reference(s) point to files that do not exist`);
      }
      grunt.log.ok(`verified ${refs.length} media reference(s)`);
    });

    grunt.registerTask('build-key', ['build-key-from-ink', 'verify-media']);
    grunt.registerTask('build-html', ['browserify:mayfly']);
    grunt.registerTask('build-misc', ['build-key', 'build-html']);
  };