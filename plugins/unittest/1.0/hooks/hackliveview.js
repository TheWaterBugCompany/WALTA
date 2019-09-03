const debug = require('debug')('thecodesharman:hackliveview');
exports.cliVersion = '>=5.2';
exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', { priority: 500, pre: function(builder,finished) {
        debug('build.post.compile: disabling LiveView');
        cli.argv.liveview = false;
        finished();
    } });
};