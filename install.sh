#! /bin/sh
SPECS_LIB_DIR=walta-app/app/specs/lib
LIB_DIR=walta-app/app/lib/lib
if [ ! -d $SPECS_LIB_DIR ]; then
  mkdir $SPECS_LIB_DIR
fi
if [ ! -d $LIB_DIR ]; then
  mkdir $LIB_DIR
fi
cp ./node_modules/chai/chai.js $SPECS_LIB_DIR/chai.js
cp ./node_modules/mocha/mocha.js $SPECS_LIB_DIR/mocha.js
cp ./node_modules/moment/moment.js $LIB_DIR/moment.js
liveview install clihooks
