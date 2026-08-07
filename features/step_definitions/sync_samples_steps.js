'use strict';
const { Given, When, Then } = require('@cucumber/cucumber');

When('I open the sample history and tap Sync Now', {timeout: 60000}, async function () {
    await this.menu.selectArchive();
    await this.archive.clickSyncNow();
});

Then('the sync popup completes successfully', {timeout: 120000}, async function () {
    await this.syncFeedback.waitForSuccess();
});

When('I tap Show Logs in the sync popup', async function () {
    await this.syncFeedback.openLogs();
});

Then('the log pane shows sync activity from the Logger', async function () {
    // Assert the completion line of the sync the popup itself ran. The VM
    // subscribes to the Logger when the popup opens, before view.start() kicks
    // off the sync, so this sync's "Sync finished" line is caught live — no
    // dependency on the SqlSink snapshot. "Downloading site photo" can't be
    // used: the LOGGEDIN auto-sync downloads the sample before the user taps
    // Sync Now, so the observed Sync-Now sync has nothing to download and never
    // logs it (a double-sync race that made this step flaky on iOS CI).
    await this.syncFeedback.expectLogsContain("Sync finished");
});

When('I remember the first {int} lines of the log pane', async function (n) {
    const { expect } = require('chai');
    const lines = await this.syncFeedback.firstNonEmptyLines(n);
    // RED guard: if SqlSink never registered (e.g. migrations skipped),
    // the pane is empty and there's nothing to remember. Fail here with
    // a clear message rather than silently capturing [] and trivially
    // passing the later "still contains" assertion.
    expect(lines, "log pane was empty — nothing to remember").to.have.length.at.least(n);
    this.rememberedLogLines = lines;
});

Then('the log pane still contains the remembered lines', async function () {
    await this.syncFeedback.expectLogPaneContainsAll(this.rememberedLogLines);
});

When('I close the sync popup', async function () {
    await this.syncFeedback.clickClose();
});

When('I close and reopen the app', { timeout: 120000 }, async function () {
    const appId = global.launcher.appId;
    await this.driver.terminateApp(appId);
    // Must relaunch via the launcher, not driver.activateApp — only launch()
    // re-passes the mock-server args; activateApp would point the app at prod.
    await global.launcher.launch(appId, global.launcher.launchArgs);
    await global.launcher.waitForForeground();
    await this.menu.waitFor();
});

Given('one or more samples have been stored but not uploaded', function() {
  /*  MockServer.create_sample_upload()
    set_gps_coordinates( -122.084, 37.422 )
    @current_page = SampleDriver
        .start_survey()
        .add_taxon_via_browse('Acarina')
        .add_taxon_via_browse('Aeshnidae')
        .add_taxon_via_browse('Agapetus')
        .add_taxon_via_browse('Amphipoda')
        .add_taxon_via_browse('Anisops')
        .add_taxon_via_browse('Anostraca')
        .add_taxon_via_browse('Athericidae')
        .submit_sample()*/
});
  


Then('all the pending samples are uploaded to the server', function() {
    /* serverReq = JSON.parse( Mirage::Client.new.requests(3).body )
    expect( serverReq["survey_type"] ).to eq("detailed")
    expect( serverReq["waterbody_name"] ).to eq("Test waterbody name")
    expect( serverReq["nearby_feature"] ).to eq("Test near by feature")
    expect( serverReq["creatures"] ).to be_deep_equal([
        {
            "count" => 1,
            "creature_id" => 12,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>13,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>19,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>70,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>118,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>124,
            "photos_count"=>0
        },
        {
            "count"=>1,
            "creature_id"=>156,
            "photos_count"=>0
        }])
    expect( serverReq["habitat"]["openWater"] ).to be(100);
    expect( serverReq["habitat"]["edgePlants"] ).to be(0);
    expect( serverReq["habitat"]["aquaticPlants"] ).to be(0);
    expect( serverReq["habitat"]["wood"] ).to be(0);
    expect( serverReq["habitat"]["sandOrSilt"] ).to be(0);
    expect( serverReq["habitat"]["gravel"] ).to be(0);
    expect( serverReq["habitat"]["boulder"] ).to be(0);
    expect( serverReq["habitat"]["leafPacks"] ).to be(0); */

});
  