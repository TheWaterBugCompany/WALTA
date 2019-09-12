const debug = require('debug')('thecodesharman:hackliveview');
exports.cliVersion = '>=5.2';
exports.init = function (logger, config, cli) {
	cli.addHook('build.post.compile', { priority: 1, pre: function(builder,finished) {
        debug('disabling LiveView');
        cli.argv.liveview = false;
        finished();
    } });
};