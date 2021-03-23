const debug = require('debug')('thecodesharman:transpilefix'),
	path = require('path'),
	join = path.join,
	fs = require('fs-extra')

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	debug("Initializing transpilefix...")
	async function compileJsFile(data) {
		let [ r, from, to ] = data.args;
		if ( /unit-test\/lib\/mocha\.js/.test(from) ) {
			logger.info(`Not transpiling file: ${from}`);
			delete data.fn; 
			const dir = path.dirname(to);
			await fs.ensureDir(dir);
			await fs.writeFile(to, r.contents);
		}
	}

	cli.addHook('build.ios.compileJsFile', { pre: compileJsFile } );
	cli.addHook('build.android.compileJsFile', { pre: compileJsFile });
};