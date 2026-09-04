require("spec/lib/ti-mocha");
var moment = require('lib/moment')
var Topics = require('ui/Topics'); 
var { SURVEY_ORDER, SURVEY_DETAILED, WATERBODY_LAKE } = require("logic/Sample");
var { expect } = require("spec/lib/chai");
var { closeWindow, controllerOpenTest, checkTestResult, setManualTests, waitFor } = require("spec/util/TestUtils");
var { simulatePhotoCapture } = require("spec/mocks/MockCamera");
describe("SiteDetails controller", function() {
    var ctl;
    var sample;
    function fireTabClick( ctl, index ) {
        var tab = ctl.getButtons()[index];
        ctl.segCtrlWrapper.fireEvent("click", { x: tab.rect.x + tab.rect.width/2, y: tab.rect.y} );
    }

	beforeEach( function() {
        sample = Alloy.Models.instance("sample");
        sample.clear();
        sample.set("lng", "147.671339");
        sample.set("lat", "-42.890748");
        sample.set("surveyType", SURVEY_DETAILED );
	});
	afterEach( function(done) {
        sample.off();
        // The WB-176 overflow test skips on Android before assigning ctl,
        // so the shared teardown must guard against a null controller.
        if (ctl) closeWindow( ctl.getView(), done );
        else done();
        sample = null;
        ctl = null;
    });
    
	it('should display the SiteDetails view', function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
		controllerOpenTest( ctl, done );
    });

    it('should save the survey type field', function(done) {   
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(SURVEY_ORDER);
            }, done));
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
        } );
    });

    it('should save the water body type field', function(done) {    
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
		controllerOpenTest( ctl, function() {
            ctl.on("updated", () => checkTestResult( done, () => {
                expect( parseInt( sample.get("surveyType") ) ).to.equal(WATERBODY_LAKE);
            }));
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
        } );
    });
 
    it('should save the photo field', function(done){
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl,  async ()=>{
            // set a photo as if taken by the user
            simulatePhotoCapture( ctl.photoSelect );
            // photoTaken persists the full photo to the sample, then the widget
            // re-displays it as a thumbnail cropped to the panel (WB-175) — so
            // assert on the saved path, not the displayed thumbnail's name.
            await waitFor( () => !!sample.get("sitePhotoPath") );
            await waitFor( () => Ti.Filesystem.getFile( ctl.photoSelect.getThumbnailImageUrl() ).exists() );
            checkTestResult( done, () => {
                expect( sample.get("sitePhotoPath") ).to.include("sitePhoto");
                expect( Ti.Filesystem.getFile( ctl.photoSelect.getThumbnailImageUrl() ).exists() ).to.be.ok;
            });
        });
    });

    it('should save waterbody name field', function(done) { 
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            ctl.waterbodyNameField
                .addEventListener("change", () => checkTestResult( done, function changeHandler() {
                    ctl.waterbodyNameField
                        .removeEventListener("change", changeHandler);
                    expect( sample.get("waterbodyName") ).to.equal("Test Waterbody");
            }));
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");
        } );
    });

    it('should save near by feature field', function(done) {    
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            ctl.nearByFeatureField
                .addEventListener("change", function changeHandler() {
                    ctl.nearByFeatureField
                        .removeEventListener("change", changeHandler);
                    expect( sample.get("nearbyFeature") ).to.equal("Near by feature");
                    done();
            } );
            ctl.nearByFeatureField.value = "Near by feature";
            ctl.nearByFeatureField.fireEvent("change");
        } );
    });

    
    it('should disable the next button if mandatory fields are unset', function(done) {    
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.nextButton.button.enabled ).to.be.false;
            ctl.on("updated", function changeHandler() {
                    ctl.off("updated", changeHandler);
                    setTimeout( function() {
                        expect( ctl.nextButton.button.enabled, "button should be enabled" ).to.be.true;
                        done();
                    },10);
            } );
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");

        } );
    });

    it('should fire Topics.Habitat if next button pressed', function(done) {      
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        Topics.subscribe( Topics.HABITAT, function handler() {
            Topics.unsubscribe( Topics.HABITAT, handler );
            // we recieved the signal so pass!
            done();
        });
        controllerOpenTest( ctl, function() {
            expect( ctl.nextButton.button.enabled ).to.be.false;
            ctl.on("updated", function handler() {
                    ctl.off("updated", handler);
                    // screen refresh neeeds to happen so put the click action on 
                    // the queue to run afterwards.
                    setTimeout( () => ctl.nextButton.NavButton.fireEvent("click"), 0 );
            } );
            fireTabClick( ctl.surveyLevelSelect, SURVEY_ORDER );
            fireTabClick( ctl.waterbodyTypeSelect, WATERBODY_LAKE );
            ctl.waterbodyNameField.value = "Test Waterbody";
            ctl.waterbodyNameField.fireEvent("change");
        } );
    });

    it('should display "unobtained location" with no lock', function(done) {       
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            // unset these here to avoid triggering the geolocation service
            sample.unset("lng");
            sample.unset("lat");
            expect( ctl.locationStatus.text ).to.equal("Location unobtained");
            done();
        } );
    });

    it('should display location coordinates with a lock', function(done) {     
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            done();
        } );
    });

    it('should update coordinates when gps lock is obtained', function(done) {   
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            sample.unset("lng");
            sample.unset("lat");
            Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: -41.8907, longitude: 145.6713, accuracy: 1 });
            setTimeout( () => checkTestResult( done, () => {
                expect( ctl.locationStatus.text ).to.equal("41.8907°S 145.6713°E");
            }), 50 );
        } );
    });
    
    it('should update coordinates when location is changed', function(done) {        
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            sample.set("lng", "145.671339");
            sample.set("lat", "-41.890748");
            setTimeout( () => checkTestResult( done, () => {
                expect( ctl.locationStatus.text ).to.equal("41.8907°S 145.6713°E");
            }), 50 );
        } );
    });

    it('should NOT update coordinates when a new gps lock is obtained if location already set', function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: 23, longitude: 100, accuracy: 1 });
            setTimeout( () => checkTestResult( done, () =>  {
                expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            }), 50 );
        } );
    });

    it('stops responding to GPSLOCK once the window is closed (no subscriber leak)', function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            // Arm the handler: with no location set, a GPSLOCK would set one.
            sample.unset("lng");
            sample.unset("lat");
            closeWindow( ctl.getView(), function() {
                ctl = null; // afterEach must not close it again
                Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: -41.8907, longitude: 145.6713, accuracy: 1 });
                setTimeout( () => checkTestResult( done, () => {
                    expect( sample.get("lat"), "location must not be set after the window is closed" ).to.not.be.ok;
                }), 50 );
            });
        } );
    });


    it('should open a map viewer when location icon is clicked', function(done) {   
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.locationStatus.text ).to.equal("42.8907°S 147.6713°E");
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                done();
            }, 50 );
        } );
    }); 
    
    it('should have editable fields', async function() {   
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        await controllerOpenTest( ctl );
        expect( ctl.surveyLevelSelect.isDisabled() ).to.be.false;
        expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.false;
        if (OS_ANDROID) {
            expect( ctl.waterbodyNameField.editable ).to.be.undefined;
            expect( ctl.nearByFeatureField.editable ).to.be.undefined;
        } else {
            expect( ctl.waterbodyNameField.editable ).to.be.true;
            expect( ctl.nearByFeatureField.editable ).to.be.true;
        }
    });

    it('should NOT have editable fields in read only mode', async function() {     
        ctl = Alloy.createController("SiteDetails", { readonly: true, sample: Alloy.Models.instance("sample") });
        await controllerOpenTest( ctl );
        expect( ctl.surveyLevelSelect.isDisabled() ).to.be.true;
        expect( ctl.waterbodyTypeSelect.isDisabled() ).to.be.true;
        expect( ctl.waterbodyNameField.editable ).to.be.false;
        expect( ctl.nearByFeatureField.editable ).to.be.false;
    });

    it("photo should be selectable", function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.camera.visible).to.be.true;
            done();
        } );
    });

    // WB-28: #right must fit within the safe-area-padded viewport so the
    // camera icon stays on-screen on notched iPhones.
    it("right column should fit within the content area (WB-28)", function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            setTimeout( function() {
                var right = ctl.right;
                var win = ctl.TopLevelWindow;
                var sap = win.safeAreaPadding || {};
                var visibleRight = win.size.width - sap.right;
                expect( right.rect.x + right.rect.width ).to.be.at.most( visibleRight );
                done();
            }, 800 );
        } );
    });

    // WB-176: with a photo set, three right-anchored icons appear. On notched
    // iPhones the safe-area insets shrink the keyboard-tweak ScrollView frame
    // below the window; its contentWidth must follow, or the content overflows
    // horizontally and the rightmost (camera) icon is clipped off-screen.
    it("photo panel content must not overflow the ScrollView horizontally (WB-176)", async function() {
        if ( OS_ANDROID ) this.skip(); // no ScrollView wrap on Android
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        await controllerOpenTest( ctl );
        var loaded = new Promise( (resolve) => ctl.photoSelect.on("loaded", resolve) );
        simulatePhotoCapture( ctl.photoSelect );
        await loaded;
        await waitFor( () => ctl.content.apiName === "Ti.UI.ScrollView" && ctl.content.size.width > 0 );
        // The overflow only exists where safe-area insets shrink the frame below
        // the window (notched iPhones in landscape); nothing to test otherwise.
        var sap = ctl.TopLevelWindow.safeAreaPadding || {};
        if ( !( sap.left > 0 || sap.right > 0 ) ) this.skip();
        // Wait for the inset to actually shrink the frame — the bug's live state.
        await waitFor( () => ctl.content.size.width < ctl.TopLevelWindow.size.width );
        // Drive one more layout pass so fixScrollContentsSize reconciles
        // contentWidth against the now-settled frame (the idle spec harness
        // doesn't otherwise fire it again after the frame shrinks).
        ctl.TopLevelWindow.fireEvent("postlayout");
        expect( ctl.content.contentWidth ).to.be.at.most( ctl.content.size.width );
    });


    // WB-302: the fields must not resize when applyKeyboardTweaks re-parents
    // the content into its ScrollView — a Ti.UI.SIZE wrapper whose child carries
    // percentage margins resolves differently in the two measurement contexts.
    it("text fields keep their height when the content is wrapped for the keyboard", async function() {
        if ( OS_ANDROID ) this.skip(); // no ScrollView wrap on Android
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        await controllerOpenTest( ctl );
        expect( ctl.content.apiName, "must sample the heights before the wrap" ).to.equal("Ti.UI.View");
        var unwrapped = [ ctl.waterbodyNameField.rect.height, ctl.nearByFeatureField.rect.height ];
        await waitFor( () => ctl.content.apiName === "Ti.UI.ScrollView" );
        expect( [ ctl.waterbodyNameField.rect.height, ctl.nearByFeatureField.rect.height ] ).to.eql( unwrapped );
    });

    it("photo should NOT be selectable when in read only mode", function(done) {
        ctl = Alloy.createController("SiteDetails", { readonly: true, sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            expect( ctl.photoSelect.camera.visible).to.be.false;
            done();
        } );
    });

    it("location should be selectable", function(done) {
        ctl = Alloy.createController("SiteDetails", { sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                expect( ctl.locationEntry.args.readonly).to.be.false;
                done();
            }, 50 );
        } ); 
    }); 

    it("location should NOT be selectable when in read only mode", function(done) {
        ctl = Alloy.createController("SiteDetails", { readonly: true, sample: Alloy.Models.instance("sample") });
        controllerOpenTest( ctl, function() {
            ctl.locationIndicator.fireEvent("click");
            setTimeout( function() {
                expect( ctl.locationEntry.getView().visible ).to.be.true;
                expect( ctl.locationEntry.args.readonly).to.be.true;
                done();
            }, 50 );
        } ); 
    }); 
});