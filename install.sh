#! /bin/sh
SPECS_LIB_DIR=walta-app/app/specs/lib
if [ ! -d $SPECS_LIB_DIR ]; then
  mkdir $SPECS_LIB_DIR
fi
cp ./node_modules/chai/chai.js $SPECS_LIB_DIR/chai.js
cp ./node_modules/mocha/mocha.js $SPECS_LIB_DIR/mocha.js
liveview install clihooks
