const debug = require('debug')('thecodesharman:unittest'),
	path = require('path'),
	join = path.join;

exports.cliVersion = '>=5.2';

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

	cli.addHook('build.android.config', doConfig);
	cli.addHook('build.ios.config', doConfig);
	cli.addHook('build.windows.config', doConfig);

	function copyResource(data, finished) {
		debug('Running pre:build.' + cli.argv.platform + '.copyResource hook');

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

	cli.addHook('build.ios.copyResource', { pre: copyResource });
	cli.addHook('build.android.copyResource', { pre: copyResource });
	cli.addHook('build.windows.copyResource', { pre: copyResource });

};