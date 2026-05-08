var Logger = require('util/Logger');
var debug = (m, tag = "ui") => Logger.debug(m, tag);
debug("Unit Test Build Initializing...");
require("spec/index");