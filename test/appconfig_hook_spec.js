var { expect } = require("chai");
var { buildAppConfig } = require("../plugins/unittest/1.0/hooks/appconfig");

describe("appconfig hook — buildAppConfig", function () {
    it("merges the environment name into the config", function () {
        var source = { cerdiServerUrl: "https://example/v1", cerdiApiSecret: "shh" };
        expect(buildAppConfig(source, "test")).to.deep.equal({
            cerdiServerUrl: "https://example/v1",
            cerdiApiSecret: "shh",
            environment: "test",
        });
    });

    it("overrides any environment value already in the source", function () {
        var source = { cerdiServerUrl: "x", environment: "stale" };
        expect(buildAppConfig(source, "production").environment).to.equal("production");
    });
});
