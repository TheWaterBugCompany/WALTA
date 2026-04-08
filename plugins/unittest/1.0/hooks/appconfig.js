const debug = require('debug')('thecodesharman:appconfig'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=5.2';

exports.init = function (logger, config, cli) {
	debug("Initializing appconfig...")

	function copyBuildConfig(data, finished) {
		debug("entering copyBuildConfig ");
		const argIdx = process.argv.indexOf('--app-config');
		const appConfig = (argIdx !== -1 && process.argv[argIdx + 1])
			? process.argv[argIdx + 1]
			: (cli.argv["app-config"] || 'mock');
		let buildConfigFile = join(data.projectDir, "app",`app-config.${appConfig}.json`);
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