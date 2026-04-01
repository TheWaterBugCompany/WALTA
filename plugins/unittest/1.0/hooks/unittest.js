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
		debug(`createSpecSymlink: isUnitTest=${isUnitTest}`);

		const specSymlink = join(cli.argv['project-dir'], 'app', 'lib', 'spec');
		try { fs.unlinkSync(specSymlink); } catch(e) {}
		if (isUnitTest) {
			debug('Creating app/lib/spec symlink for unit-test build');
			fs.symlinkSync('../spec', specSymlink);
		}

		const indexSymlink = join(cli.argv['project-dir'], 'app', 'controllers', 'index.js');
		try { fs.unlinkSync(indexSymlink); } catch(e) {}
		const target = isUnitTest ? 'UnitTest.js' : 'index-app.js';
		debug(`Symlinking app/controllers/index.js -> ${target}`);
		fs.symlinkSync(target, indexSymlink);

		finished();
	}

	cli.on('build.pre.compile', { pre: createSpecSymlink, priority: 5000 });

};