const ChangeNotifier = require("../util/ChangeNotifier");

// One entry in a menu (the icon + title + description card). A first-class row
// view-model for the collection binder: the screen builds one per option and
// the MenuButton component binds it. Disabled entries grey and swallow taps.
// Titanium-free.
const ENABLED_COLOR = "#cfdbf3";
const DISABLED_COLOR = "#e6e6e6";

class MenuEntryViewModel extends ChangeNotifier {
  constructor({ key, icon, title, description, disabled = false, size, onSelect }) {
    super();
    this._key = key;
    this._icon = icon;
    this._title = title;
    this._description = description;
    this._disabled = disabled;
    this._size = size;
    this._onSelect = onSelect;
  }

  get key() { return this._key; }
  get icon() { return this._icon; }
  get title() { return this._title; }
  get description() { return this._description; }
  get disabled() { return this._disabled; }
  get size() { return this._size; }

  // Fall back to description when title is null: iOS hides a nameless button
  // and its children from the a11y tree, so a title-less card would vanish.
  get accessibilityLabel() { return this._title || this._description; }

  get buttonColor() { return this._disabled ? DISABLED_COLOR : ENABLED_COLOR; }
  get buttonOpacity() { return this._disabled ? 0.5 : 1; }

  select() {
    if (!this._disabled && this._onSelect) this._onSelect();
  }
}

module.exports = MenuEntryViewModel;
