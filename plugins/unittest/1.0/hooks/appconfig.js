const debug = require('debug')('thecodesharman:appconfig'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=5.2';

function buildAppConfig(source, environment) {
	return Object.assign({}, source, { environment });
}

exports.buildAppConfig = buildAppConfig;

exports.init = function (logger, config, cli) {
	debug("Initializing appconfig...")

	function copyBuildConfig(data, finished) {
		debug("entering copyBuildConfig ");
		const argIdx = process.argv.indexOf('--app-config');
		const appConfig = (argIdx !== -1 && process.argv[argIdx + 1])
			? process.argv[argIdx + 1]
			: (cli.argv["app-config"] || 'test');
		let buildConfigFile = join(data.projectDir, "app",`app-config.${appConfig}.json`);
		if ( fs.existsSync(buildConfigFile) ) {
			debug(`file ${buildConfigFile} exists!`);
			const source = JSON.parse(fs.readFileSync(buildConfigFile, 'utf8'));
			const merged = buildAppConfig(source, appConfig);
			fs.writeFileSync(
				join(data.projectDir, "Resources", "app-config.json"),
				JSON.stringify(merged, null, 2)
			);
		} else {
			finished(new Error(`App config file not found: ${buildConfigFile}\nRun install.sh or create the file manually.`));
			return;
		}
		finished();
	}

	cli.addHook('build.pre.compile', { post: copyBuildConfig, priority: 5000 });
};