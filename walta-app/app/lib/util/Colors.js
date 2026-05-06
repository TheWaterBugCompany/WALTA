// Single source of truth for the colour palette across both Alloy
// runtime contexts (where Alloy.CFG.colors is populated from
// config.json by the Alloy compiler) and bare-Node test contexts
// (where Alloy is undefined). The palette itself is defined in
// app/config.json under global.colors.
let colors;
if (typeof Alloy !== "undefined" && Alloy.CFG && Alloy.CFG.colors) {
  colors = Alloy.CFG.colors;
} else {
  colors = require("../../config.json").global.colors;
}
module.exports = colors;
