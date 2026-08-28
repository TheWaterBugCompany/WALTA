import { expect } from "chai";
import { renderTiapp } from "../../build-utils/tiappConfig.js";

const TEMPLATE = `<ti:app>
  <property name="mapsKey">GOOGLE_MAPS_API_KEY_PLACEHOLDER</property>
  <key>UISupportedInterfaceOrientations~iphone</key>
  <array>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
</ti:app>`;

describe("renderTiapp", function () {
  it("substitutes the maps key into the template", function () {
    expect(renderTiapp(TEMPLATE, { mapsApiKey: "abc123" })).to.contain("<property name=\"mapsKey\">abc123</property>");
  });

  it("empties the placeholder when no key is set, rather than shipping the placeholder", function () {
    expect(renderTiapp(TEMPLATE, {})).to.contain("<property name=\"mapsKey\"></property>");
  });

  // Every build gets the plist the app ships. The visual suite pins the landscape
  // it captures in from the runner, so no build has to differ from production.
  it("leaves the declared orientations alone", function () {
    const xml = renderTiapp(TEMPLATE, { mapsApiKey: "k" });
    expect(xml).to.contain("UIInterfaceOrientationLandscapeLeft");
    expect(xml).to.contain("UIInterfaceOrientationLandscapeRight");
  });
});
