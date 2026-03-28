const debug = require('debug')('thecodesharman:stripsimincompatiblemodules');

// Modules that have no arm64-simulator slice and must be excluded from
// simulator builds. Add module IDs here as needed.
const SIM_INCOMPATIBLE_MODULES = [
	'be.aca.mobile.bugfender',
];

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	debug("Initializing stripsimincompatiblemodules...");

	function stripModules(data, finished) {
		if (data.target !== 'simulator') {
			return finished();
		}
		// Filter the resolved modules list (used for resource copying and linking)
		if (Array.isArray(data.modules)) {
			data.modules = data.modules.filter(m => !SIM_INCOMPATIBLE_MODULES.includes(m.id));
		}
		// Clear legacy modules set (used for the arm64 arch error check)
		if (data.legacyModules instanceof Set) {
			SIM_INCOMPATIBLE_MODULES.forEach(id => data.legacyModules.delete(id));
		}
		// Filter nativeLibModules — this is what drives the Xcode .a link phase
		if (Array.isArray(data.nativeLibModules)) {
			data.nativeLibModules = data.nativeLibModules.filter(m => !SIM_INCOMPATIBLE_MODULES.includes(m.id));
		}
		// Also filter tiapp.modules so incremental build hashes stay consistent
		if (Array.isArray(data.tiapp.modules)) {
			data.tiapp.modules = data.tiapp.modules.filter(m => !SIM_INCOMPATIBLE_MODULES.includes(m.id));
		}
		logger.info(`[stripsimincompatiblemodules] Stripped simulator-incompatible module(s) for simulator build: ${SIM_INCOMPATIBLE_MODULES.join(', ')}`);
		finished();
	}

	cli.addHook('build.pre.construct', { post: stripModules, priority: 5000 });
};
