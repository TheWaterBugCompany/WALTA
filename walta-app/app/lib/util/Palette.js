// Palette colour enum — see docs/patterns/viewmodels.md "Semantic palette colours".
// Each Symbol's .description must match the corresponding key in app/config.json
// under global.colors.
const Palette = {
  white:        Symbol("white"),
  black:        Symbol("black"),
  primary:      Symbol("primary"),
  primaryLight: Symbol("primaryLight"),
  error:        Symbol("error"),
  errorDark:    Symbol("errorDark"),
  success:      Symbol("success"),
  failure:      Symbol("failure"),
  disabled:     Symbol("disabled"),
};

module.exports = Palette;
