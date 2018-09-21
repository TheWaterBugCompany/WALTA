Given(/^one or more samples have been stored but not uploaded$/) do
    MockServer.create_sample_upload()
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
        .submit_sample()
end
  
When(/^the server becomes reachable$/) do
    # its always reachable
end

Then(/^all the pending samples are uploaded to the server$/) do
    serverReq = JSON.parse( Mirage::Client.new.requests(3).body )
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
    expect( serverReq["habitat"]["leafPacks"] ).to be(0);

end
  