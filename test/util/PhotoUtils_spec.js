require("mocha");
const { expect } = require("chai");

// see docs/patterns/photo-paths.md
describe("PhotoUtils.absolutePath", function () {
    let PhotoUtils;

    beforeEach(function () {
        // Minimal Ti.Filesystem fake. getFile mimics Titanium's join of a base
        // directory + a relative segment so we can assert on the resolved
        // nativePath an outside caller would actually open.
        global.Ti = {
            Filesystem: {
                applicationDataDirectory: "file:///CURRENT/Documents/",
                resourcesDirectory: "file:///APP/",
                getFile(...parts) {
                    const joined = parts.length === 1
                        ? parts[0]
                        : parts[0].replace(/\/?$/, "/") + parts[1].replace(/^\//, "");
                    return { nativePath: joined };
                },
            },
        };
        delete require.cache[require.resolve("../../walta-app/app/lib/util/PhotoUtils")];
        PhotoUtils = require("../../walta-app/app/lib/util/PhotoUtils");
    });

    afterEach(function () {
        delete global.Ti;
    });

    it("heals a stale-container absolute path by resolving its basename under the current data directory", function () {
        const stale = "file:///var/mobile/Containers/Data/Application/A9DE96B2-CF38-43A8-B4B6-8004E476D1D7/Documents/taxon_11_72_1758403455.jpg";
        expect(PhotoUtils.absolutePath(stale).nativePath)
            .to.equal("file:///CURRENT/Documents/taxon_11_72_1758403455.jpg");
    });

    it("resolves a relative photo name under the current data directory", function () {
        expect(PhotoUtils.absolutePath("taxon_11_72_1758403455.jpg").nativePath)
            .to.equal("file:///CURRENT/Documents/taxon_11_72_1758403455.jpg");
    });

    it("resolves a taxonomy reference image under the resources directory", function () {
        expect(PhotoUtils.absolutePath("/images/silhouette.png").nativePath)
            .to.equal("file:///APP/images/silhouette.png");
    });
});
