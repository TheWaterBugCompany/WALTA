const debug = require('debug')('thecodesharman:applesilliconfix'),
	path = require('path'),
	join = path.join,
	fs = require('fs-extra')

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	debug("Initializing applesilliconfix...")
	async function fixBuildParams(data, callback) {
		data.args[1].push("-destination", "generic/platform=iOS");
		callback(null, data);
	}

	cli.addHook('build.ios.xcodebuild', { pre: fixBuildParams } );
};