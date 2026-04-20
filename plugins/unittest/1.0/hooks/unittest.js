const debug = require('debug')('thecodesharman:unittest'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=3.2';

exports.init = function (_logger, _config, cli) {


	function doConfig(data, finished) {
		debug('Running build.[PLATFORM].config hook');
		const r = data.result[1];
		r.flags || (r.flags = {});
		r.flags["unit-test"] = {
			default: false,
			desc: "enables mocha unit test runner"
		};
		finished(null, data);
	}

	cli.on('build.android.config', doConfig);
	cli.on('build.ios.config', doConfig);
	cli.on('build.windows.config', doConfig);

	function createSpecSymlink(_build, finished) {
		// cli.argv["unit-test"] is undefined in `titanium serve` context because the plugin's
		// init() runs after CLI argv parsing. Fall back to process.argv as a reliable source.
		const isUnitTest = cli.argv["unit-test"] || process.argv.includes('--unit-test');
		// Simulator/emulator builds (acceptance + unit-test + local debug)
		// swap the Camera module to a Ti.UI-based test implementation — the
		// iOS simulator's native picker can't be driven by Appium/WDA and
		// the Android emulator's camera is similarly awkward to automate.
		// Ti CLI uses `simulator` for iOS and `emulator` for Android.
		const targetArgIdx = process.argv.indexOf('--target');
		const targetArg = targetArgIdx >= 0 ? process.argv[targetArgIdx + 1] : cli.argv.target;
		const isSimulator = targetArg === 'simulator' || targetArg === 'emulator';
		debug(`createSpecSymlink: isUnitTest=${isUnitTest}, isSimulator=${isSimulator}`);

		const specSymlink = join(cli.argv['project-dir'], 'app', 'lib', 'spec');
		try { fs.unlinkSync(specSymlink); } catch(e) {}
		// Simulator builds need the spec symlink too — Camera-test.js reads
		// spec/resources/site-mock.jpg when the shutter is tapped.
		if (isUnitTest || isSimulator) {
			debug('Creating app/lib/spec symlink');
			fs.symlinkSync('../spec', specSymlink);
		}

		const indexSymlink = join(cli.argv['project-dir'], 'app', 'controllers', 'index.js');
		try { fs.unlinkSync(indexSymlink); } catch(e) {}
		const indexTarget = isUnitTest ? 'UnitTest.js' : 'index-app.js';
		debug(`Symlinking app/controllers/index.js -> ${indexTarget}`);
		fs.symlinkSync(indexTarget, indexSymlink);

		// Swap the Camera wrapper for simulator builds. Using a file copy
		// rather than a symlink because Alloy's Resource copy step chokes on
		// a Camera.js symlink pointing to a sibling file in the same dir
		// ("Cannot copy X to a subdirectory of itself").
		const cameraDir = join(cli.argv['project-dir'], 'app', 'lib', 'ui');
		const cameraDst = join(cameraDir, 'Camera.js');
		const cameraSrc = join(cameraDir, isSimulator ? 'Camera-test.js' : 'Camera-prod.js');
		debug(`Copying ${cameraSrc} -> ${cameraDst}`);
		fs.copyFileSync(cameraSrc, cameraDst);

		finished();
	}

	cli.on('build.pre.compile', { pre: createSpecSymlink, priority: 5000 });

};