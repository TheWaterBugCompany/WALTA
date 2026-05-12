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
    // SampleSync emits "Sync finished successfully" via Logger.info when
    // the chain completes — the LOG_FILTER (facility=sync, minLevel=info)
    // surfaces it in the pane. Since the previous step already awaited
    // "Sync complete", that info entry has been recorded by now.
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
    await this.driver.activateApp(appId);
    // Wait for the freshly-activated app to reach foreground state, then
    // for the Menu to land after the persisted-token auto-login completes.
    // Mirrors the foreground-poll in the BeforeAll cold-launch path.
    // Android's `mobile: queryAppState` takes `appId`; iOS takes `bundleId`.
    const queryArgs = this.platform === 'android' ? { appId } : { bundleId: appId };
    for (let i = 0; i < 60; i++) {
        const state = await this.driver.execute('mobile: queryAppState', queryArgs);
        if (state === 4) break;
        await new Promise(r => setTimeout(r, 500));
    }
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
  