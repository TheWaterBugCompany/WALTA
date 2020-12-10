'use strict';
const { After, Before } = require('cucumber');
const http = require('http')
const hock = require('hock')

var hockServer = null;
var server = null;
 Before({tags: "@mockserver"},function(testCase, callback) {
    if ( !server ) {
        hockServer = hock.createHock();
        hockServer
            .post('/token/create/server',{
                "client_secret":"hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
                "scope":"create-users"
            })
            .reply(200, {
                "access_token": "secretaccesstoken",
                "expires_in": 31535997,
                "token_type": "Bearer"
            });
        

        server = http.createServer(hockServer.handler);
        server.listen(9999, callback);
        
        global.hockServer = hockServer;
        global.server = server;
    }
});


After({tags: "@mockserver"}, function() {
    if ( server ) {
        server.close();
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