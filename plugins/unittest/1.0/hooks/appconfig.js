const debug = require('debug')('thecodesharman:appconfig'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=5.2';

exports.init = function (logger, config, cli) {
	debug("Initializing appconfig...")

	function doConfig(data, finished) {
		debug('Running build.config hook');
		const r = data.result[1];		
		r.flags || (r.flags = {});
		r.options["app-config"] = {
			desc: "which build configuration to use",
			default: "test",
			values: [
				"test",
				"production",
				"mock",
				"mitm"
			]
		};
		finished(null, data);
	}

	cli.addHook('build.config', doConfig);

	function copyBuildConfig(data, finished) {
		debug("entering copyBuildConfig ");
		let buildConfigFile = join(data.projectDir, "app",`app-config.${cli.argv["app-config"]}.json`);
		if ( fs.existsSync(buildConfigFile) ) {
			debug(`file ${buildConfigFile} exists!`);
			fs.copyFileSync(
					buildConfigFile,
					join(data.projectDir, "Resources", "app-config.json")
				);
		} else {
			debug(`file ${buildConfigFile} NOT found`);
		}
		finished();
	}

	cli.addHook('build.pre.compile', { post: copyBuildConfig, priority: 5000 });
};