const http = require('http');
const hock = require('hock');
const path = require("path");
const { makeCerdiSampleData } = require('../../walta-app/app/assets/unit-test/fixtures/SampleData_fixture.js');

function createMockCerdiServer(callback) {
    let hockServer = hock.createHock();
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
    

    let server = http.createServer(hockServer.handler);
    server.listen(9999, callback);
    return { 
        hockServer: hockServer, 
        server: server,
        shutdown() {
            this.server.close();
        },
        makeMockSample() {
            let accessToken = "testusertoken";
            // set up user account responses
            this.hockServer
                .post("/token/create",{
                    "password":"password",
                    "email":"test@example.com"
                })
                .reply(200,{
                    "id": 38,
                    "name": "Test Example",
                    "email": "testlogin@example.com",
                    "created_at": "2018-09-07 08:55:30",
                    "updated_at": "2018-09-07 08:55:30",
                    "group": 0,
                    "survey_consent": 0,
                    "share_name_consent": 0,
                    "oauth_network": null,
                    "accessToken": accessToken
                });
            // set up samples response
            let sampleData = makeCerdiSampleData({
                photos: [{"id": 1}],
                sampled_creatures: [
                    {
                        "sample_id": 473,
                        "creature_id": 12,
                        "count": 2,
                        "photos_count": 1
                    },
                    {
                        "sample_id": 473,
                        "creature_id": 11,
                        "count": 6,
                        "photos_count": 1
                    }
                ]
            });
            this.hockServer
                .get("/samples")
                .reply(200,[sampleData]);
            this.hockServer
                .get(`/samples/${sampleData.id}/photos`)
                .reply(200,[{id:1}]);
            this.hockServer
                .get('/photos/1/view')
                .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/site-mock.jpg'));
            this.hockServer
                .get(`/samples/${sampleData.id}/creatures/12/photos`)
                .reply(200,[{id:2}]);
            this.hockServer
                .get(`/samples/${sampleData.id}/creatures/11/photos`)
                .reply(200,[{id:3}]);    
            this.hockServer
                .get('/photos/2/view')
                .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/simpleKey1/media/amphipoda_01.jpg'));
            this.hockServer
                .get('/photos/3/view')
                .replyWithFile(200, path.join(__dirname,'../../walta-app/app/assets/unit-test/resources/simpleKey1/media/phreatoicidae.jpg'));
        }
    };
}

exports.createMockCerdiServer = createMockCerdiServer;