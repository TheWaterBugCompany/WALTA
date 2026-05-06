// Palette colour enum. ViewModels return one of these Symbols to
// signal a semantic colour choice without depending on the Titanium
// runtime where Alloy.CFG.colors actually lives. bindView translates
// the Symbol back to a hex value at render time using the palette
// object the controller hands it (typically Alloy.CFG.colors). Each
// Symbol's .description matches the corresponding key in
// app/config.json under global.colors.
const Palette = {
  white:        Symbol("white"),
  black:        Symbol("black"),
  primary:      Symbol("primary"),
  primaryLight: Symbol("primaryLight"),
  error:        Symbol("error"),
  errorDark:    Symbol("errorDark"),
  success:      Symbol("success"),
};

module.exports = Palette;
