const debug = require('debug')('thecodesharman:buildconfig'),
	path = require('path'),
	join = path.join,
	fs = require('fs')

exports.cliVersion = '>=5.2';

exports.init = function (logger, config, cli) {


	function doConfig(data, finished) {
		debug('Running build.config hook');
		const r = data.result[1];
		debug(JSON.stringify(r,null,4));
		
		r.flags || (r.flags = {});
		r.options["build-config"] = {
			desc: "which build configuration to use",
			default: "test",
			values: [
				"test",
				"production"
			]
		};
		finished(null, data);
	}

	cli.addHook('build.config', doConfig);

	function copyBuildConfig(data, finished) {
		debug("entering copyBuildConfig ");
		let buildConfigFile = join(tempdir(),`buildconfig.${cli.argv["build-config"]}.json`);
		debug(JSON.stringify(Object.keys(data),null,4));
		if ( fs.existsSync(buildConfigFile) ) {
			debug(`file ${buildConfigFile} exists!`);
			fs.copyFileSync(
					buildConfigFile,
					join(tempdir(), 'buildconfig.json')
				);
		} else {
			debug(`file ${buildConfigFile} NOT found`);
		}
		finished();
	}

	cli.addHook('build.pre.compile', { post: copyBuildConfig, priority: 5000 });
};