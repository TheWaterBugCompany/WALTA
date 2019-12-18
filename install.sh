#! /bin/sh
SPECS_LIB_DIR=walta-app/app/assets/unit-test/lib
LIB_DIR=walta-app/app/lib/lib
ASSET_DIR=walta-app/app/assets
if [ ! -d $SPECS_LIB_DIR ]; then
  mkdir $SPECS_LIB_DIR
fi
if [ ! -d $LIB_DIR ]; then
  mkdir $LIB_DIR
fi
if [ ! -d $ASSET_DIR ]; then
  mkdir $ASSET_DIR
fi
cp ./node_modules/chai/chai.js $SPECS_LIB_DIR/chai.js
cp ./node_modules/chai-date-string/lib/chai-date-string.js $SPECS_LIB_DIR/chai-date-string.js
cp ./node_modules/mocha/mocha.js $SPECS_LIB_DIR/mocha.js
cp ./node_modules/moment/moment.js $LIB_DIR/moment.js
cp -rf ./node_modules/leaflet/dist/* $ASSET_DIR/leaflet
PATH=./node_modules/.bin:$PATH
ti config -a paths.hooks ./plugins/unittest/1.0/hooks
# not needed in 8 GA: liveview install clihook
alloy install plugin walta-app
