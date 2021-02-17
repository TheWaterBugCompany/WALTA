'use strict';
const { After, Before } = require('cucumber');
var { createMockCerdiServer } = require('mock-cerdi-server');

Before({tags: "@mockserver"},function(testCase, callback) {
    if ( !global.mockCerdiServer ) {
        global.mockCerdiServer = createMockCerdiServer(callback);
    }
});


After({tags: "@mockserver"}, function() {
    if ( global.mockCerdiServer ) {
        global.mockCerdiServer.shutDown();
    }
}); 

/* require 'calabash-android/abase'
class MockServer

    def self.create_account
        Mirage::Client.new.put( 'token/create', <<-eos
            {
                "id": 38,
                "name": "Test Example",
                "email": "testlogin@example.com",
                "created_at": "2018-09-07 08:55:30",
                "updated_at": "2018-09-07 08:55:30",
                "group": 0,
                "survey_consent": 0,
                "share_name_consent": 0,
                "oauth_network": null,
                "accessToken": "testusertoken"
            }     
    eos
             ) do
            http_method :post
            status 200
        end
    end

    def self.create_user_does_not_exist
        Mirage::Client.new.put( 'user/create', <<-eos
            {
                "name": "Test Example",
                "email": "test-1536403292821@example.com",
                "group": 0,
                "survey_consent": 0,
                "share_name_consent": 0,
                "oauth_network": null,
                "updated_at": "2018-09-08 10:41:33",
                "created_at": "2018-09-08 10:41:33",
                "id": 102,
                "accessToken": "testuseraccesstoken"
            }     
    eos
             ) do
            http_method :post
            status 200
        end
    end

    def self.create_sample_upload
        Mirage::Client.new.put( 'samples', <<-eos
            {
                "id": 666
            }     
    eos
             ) do
            http_method :post
            status 200
        end
    end
end */