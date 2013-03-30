#!/usr/bin/env bash

set -e

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)/..

# Source directory for unbuilt code
SRCDIR="$BASEDIR/walta-app/src"

# Taqxonomy data
TAXONDIR="$BASEDIR/walta-data/taxonomies/test"

# Directory containing dojo build utilities
TOOLSDIR="$SRCDIR/util/buildscripts"



# Destination directory for built code
DISTDIR="$BASEDIR/walta-build/platform/android/assets/www"

# Main application package build configuration
PROFILE="$BASEDIR/walta-app/profiles/walta.profile.js"

# Configuration over. Main application start up!
echo "Building application with $PROFILE to $DISTDIR."

echo -n "Cleaning old files..."
rm -rf "$DISTDIR"
echo " Done"

cd "$TOOLSDIR"

java -Xms256m -Xmx256m  -cp ../shrinksafe/js.jar:../closureCompiler/compiler.jar:../shrinksafe/shrinksafe.jar org.mozilla.javascript.tools.shell.Main  ../../dojo/dojo.js baseUrl=../../dojo load=build --profile "$PROFILE" --releaseDir "$DISTDIR" $@

cd "$BASEDIR"

#cat "$SRCDIR/index.html" | \
#perl -pe "
#  s/isDebug: *true,//;        # Remove isDebug
#  " > "$DISTDIR/index.html"

# copy across PhoneGap resources

cp -r $SRCDIR/css $DISTDIR
cp -r $SRCDIR/img $DISTDIR
cp -r $SRCDIR/js $DISTDIR
cp -r $SRCDIR/res $DISTDIR
cp -r $SRCDIR/spec $DISTDIR
cp $SRCDIR/cordova-2.5.0.js $DISTDIR
cp $SRCDIR/index.html $DISTDIR
cp $SRCDIR/main.js $DISTDIR
cp $SRCDIR/master.css $DISTDIR
cp $SRCDIR/spec.html $DISTDIR

# copy across data sets
cp -r $TAXONDIR $DISTDIR/taxonomy

# remove files not needed from Dojo build
cd $DISTDIR
find dojo ! -name dojo ! -name dojo.js -delete
find dijit ! -name dijit ! -name dijit.js -delete
find dojox ! -path "dojox/mobile/themes/iphone/*" ! -path "dojox/mobile/themes/android" ! -path "dojox" ! -path "dojox/mobile" ! -path "dojox/mobile/themes" ! -path "dojox/mobile/themes/iphone" ! -path "dojox/mobile/themes/android" ! -path "dojox/mobile/deviceTheme.js" ! -path "dojox/dojox.js" -delete
rm -rf $DISTDIR/util


echo "Build complete"
