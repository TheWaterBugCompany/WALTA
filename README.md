# WALTA

This repository contains the source code for both the iOS and the Android versions of the Waterbug App.

## Local development set up

TODO: Add brew file?
1. brew install node@20
2. brew install ios-deploy
3. npm install
4. npx appium driver install xcuitest
5. npx appium driver install uiautomator2


## Seeing logs on device

`adb logcat -s "TiAPI:*"`

## Testing

To run the unit test suite on a device:

### Runing test suite for Android
1. Make sure device is in developer mode, and is listed in the output of:
`adb devices`

2. Make choose whether or not to run the test suite in manual mode, by changing code in 
`walta-app/app/assets/unit-test/index.js`:

```javascript

// freeze each test to allow manual inspection - on Android use the menu option "Continue" to continue test.
setManualTests( false );
```

3. Run the unit test suite:
`npx grunt --platform=android unit-test`

### Running a single test
It's often useful in debugging to run a single test in order to resolve an issue.
To do this open the `spec` file for the test and add `.only` to the test or grup of tests
to only run that test.

For example, to run the only the "Main Controller" tests edit the `unit-test/Main_spec.js` file
and add `.only` to the `describe` block as follows.
```javascript
...
var KeyLoader = require('logic/KeyLoaderJson');
describe.only("Main controller", function() {
	let app;
    Alloy.Collections.instance("taxa");
...
```

### Running with live view
Whilst debugging a test it can be useful to not have to rebuild the entire app and/or reruning the
installation upload process since this is very time consuming. The solution to this is make use of
the Titanium live view.

TODO document how

## Building
Once the local development environment is configured build a release by running the 
following command:

`npx grunt --platform=android clean release && npx grunt --platform=ios release`

This will build both the Android adb and iOS ipa and place them in the folder
`walta-app/dist/Waterbug.{apk,aab,ipa}`

## Making a release

Make sure the version numbers in the `tiapp.xml` have been bumped for both Android and iOS.
Then build the release packages as decribed above.

After the release has been build the various app packages need to be uploaded to the AppStores for both
Google Play and iOS App Stores.

## Updating titanium

1. Change the TI version in `tiapp.xml` located in the `ti:app/sdk-version` key.
2. Run a build, if the latest version of titanium is not install there will be an error, if not the buld should succeed. Be sure to run the unit tests to verify everything is still working.
3. If the build fails sue to an error like:
```
The project's sdk-version is currently set to 12.1.2.GA, which is not installed.

Update the sdk-version in the tiapp.xml to one of the installed Titaniums SDKs:
    10.0.0.GA
    10.0.0.v20210323111110
    10.0.1.v20210608074008
    9.3.2.GA
or run 'titanium sdk install 12.1.2.GA' to download and install Titanium SDK 12.1.2.GA
```

Then fol