#!/usr/bin/env bash

set -e

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)/..

# Source directory for unbuilt code
SRCDIR="$BASEDIR/walta-app/src"

# Directory containing dojo build utilities
TOOLSDIR="$SRCDIR/util/buildscripts"

# Destination directory for built code
DISTDIR="$BASEDIR/walta-build/platform/android/assets/www"

PGDISTDIR="$BASEDIR/walta-build/phonegapbuild/"

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

# copy across PhoneGap resources
cp -r $SRCDIR/res $DISTDIR
cp $SRCDIR/index.html $DISTDIR
cp $SRCDIR/config.xml $DISTDIR

# copy across data sets
cp $SRCDIR/cordova*.js $DISTDIR

# remove files not needed from Dojo build
cd $DISTDIR
find dojo ! -name dojo ! -name dojo.js -delete
find dijit ! -name dijit ! -name dijit.js -delete
find dojox ! -path "dojox/dojox.js" -delete
rm -rf $DISTDIR/util

# update the phonegap build repo
cd $PGDISTDIR
find ./www -name ".*" -or -path ./www -or -path "./www/taxonomy*" -o -delete
cp --no-dereference -r $DISTDIR/* ./www/
rm ./www/cordova-*.js

# create symbolic link for testing purposes
cd $DISTDIR
ln -s $PGDISTDIR/www/taxonomy taxonomy

echo "Build complete"
