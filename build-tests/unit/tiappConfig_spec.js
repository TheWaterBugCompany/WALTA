import { expect } from "chai";
import { renderTiapp, CAPTURE_ORIENTATION } from "../../build-utils/tiappConfig.js";

// tiapp.xml is generated from tiapp.xml.template at build time. Everything here
// is about what the generated file declares, which is the only thing iOS reads.
const TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<ti:app>
  <ios>
    <plist>
      <dict>
        <key>UISupportedInterfaceOrientations~iphone</key>
        <array>
          <string>UIInterfaceOrientationLandscapeLeft</string>
          <string>UIInterfaceOrientationLandscapeRight</string>
        </array>
        <key>UISupportedInterfaceOrientations~ipad</key>
        <array>
          <string>UIInterfaceOrientationLandscapeLeft</string>
          <string>UIInterfaceOrientationLandscapeRight</string>
        </array>
      </dict>
    </plist>
  </ios>
  <android>
    <manifest>
      <meta-data android:value="GOOGLE_MAPS_API_KEY_PLACEHOLDER" />
    </manifest>
  </android>
</ti:app>
`;

function orientationsIn(xml) {
    return [...xml.matchAll(/<string>(UIInterfaceOrientation\w+)<\/string>/g)].map((m) => m[1]);
}

describe("tiapp generation", function () {
    it("substitutes the maps key the template leaves a placeholder for", function () {
        const xml = renderTiapp(TEMPLATE, { mapsApiKey: "AIza-not-a-real-key" });
        expect(xml).to.include("AIza-not-a-real-key");
        expect(xml).to.not.include("GOOGLE_MAPS_API_KEY_PLACEHOLDER");
    });

    it("ships the app supporting both landscapes, so a phone can be held either way", function () {
        const xml = renderTiapp(TEMPLATE, { mapsApiKey: "k" });
        expect(orientationsIn(xml)).to.deep.equal([
            "UIInterfaceOrientationLandscapeLeft",
            "UIInterfaceOrientationLandscapeRight",
            "UIInterfaceOrientationLandscapeLeft",
            "UIInterfaceOrientationLandscapeRight",
        ]);
    });

    // A simulator reports no device orientation, and iOS then re-resolves which
    // landscape each window opens in — so screens captured in one run disagree
    // with the next and no baseline holds. Declaring one landscape leaves it
    // nothing to resolve. This is a property of the capture build alone; the
    // shipped app above still supports both.
    it("declares one landscape for a capture build, leaving nothing to re-resolve", function () {
        const xml = renderTiapp(TEMPLATE, { mapsApiKey: "k", singleLandscape: true });
        expect(orientationsIn(xml)).to.deep.equal([CAPTURE_ORIENTATION, CAPTURE_ORIENTATION]);
    });

    it("changes nothing but the orientations when it narrows a capture build", function () {
        const shipped = renderTiapp(TEMPLATE, { mapsApiKey: "k" });
        const capture = renderTiapp(TEMPLATE, { mapsApiKey: "k", singleLandscape: true });
        const strip = (xml) => xml.replace(/\s*<string>UIInterfaceOrientation\w+<\/string>/g, "");
        expect(strip(capture)).to.equal(strip(shipped));
    });
});
