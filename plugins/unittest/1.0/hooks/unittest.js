const debug = require('debug')('thecodesharman:unittest'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {


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

	function patchLiveViewJs(build, finished) {
		if (cli.argv.liveview) {
			debug('Running pre:compile to modify live view code');
			logger.info(`Patching liveview.js`);

			// load livepatch code and add our own
			let liveviewJS = join(tempdir(), 'liveview.js');
			let payloadJs= join(__dirname, "../build/payload.js");
			fs.writeFileSync(liveviewJS,
				fs.readFileSync(liveviewJS)
					.toString()
					.replace(/Module\.patch\(globalScope,/g, fs.readFileSync(payloadJs).toString() + "\n$&" ));
		}
		finished();
	}

	function copyResource(data, finished) {
		if (cli.argv["unit-test"]) {
			const RESOURCES_DIR = join(this.projectDir, 'Resources');
			const srcFile = data.args[0];
			if (new RegExp('^' + RESOURCES_DIR.replace(/\\/g, '/') + '(/(android|ipad|ios|iphone|windows|blackberry|tizen))?/alloy/controllers/index.js$').test(srcFile.replace(/\\/g, '/'))) {
				logger.info(`Replacing controllers/index.js with controllers/UnitTest.js`);
				data.args[0] = data.args[0].replace(/\/index\.js$/g, "/UnitTest.js");
			}
		}
		finished(null, data);
	}
	cli.on('build.ios.copyResource', { pre: copyResource, priority: 5000 });
	cli.on('build.android.copyResource', { pre: copyResource, priority: 5000  });
	cli.on('build.windows.copyResource', { pre: copyResource , priority: 5000 });
	cli.on('build.pre.compile', { post: patchLiveViewJs, priority: 5000 });

};