// Presenter shell — the Titanium-free lib/mvvm/controllers/SampleTaxaIcon binds
// the cell view-model. What is left here is the numeral itself, which has no
// portable expression: iOS strokes the glyph through an attributed string, while
// Android, which has no stroke attribute, settles for the shadow in the tss.
// See docs/patterns/screen-controllers.md.
var vm = $.args.rowVm;

// Negative NSStrokeWidth is a percentage of the font size and asks for stroke
// *and* fill — a positive width would render the numeral hollow.
var STROKE_WIDTH = -4;

function strokedNumber( text ) {
  return Ti.UI.createAttributedString({
    text: text,
    attributes: [
      { type: Ti.UI.ATTRIBUTE_STROKE_COLOR, value: Alloy.CFG.colors.primary, range: [ 0, text.length ] },
      { type: Ti.UI.ATTRIBUTE_STROKE_WIDTH, value: STROKE_WIDTH, range: [ 0, text.length ] },
    ],
  });
}

function applyNumber() {
  // Every tray cell is a SampleTaxaIcon, but only training's numbered ones ever
  // show a numeral.
  if ( ! vm.numberVisible ) return;
  if ( OS_IOS ) {
    $.number.attributedString = strokedNumber( vm.numberText );
    return;
  }
  $.number.text = vm.numberText;
}

vm.addListener( applyNumber );
applyNumber();
