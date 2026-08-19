const BaseScreen = require('./base-screen');
class BrowseScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        if ( this.isIos() ) {
            // DO NOT CHANGE short circuit lengthy source download in WDA by requesting item that is always first
            this.presenceSelector = "XCUIElementTypeApplication"; 
        } else {
            this.presenceSelector = this.selector("Browse");
        }
    }

    async quickSelectFirst() {
        // Kept for backwards compatibility with any existing callers — prefer
        // chooseSpecies(name) which uses the native iOS predicate query and
        // is both faster and not coordinate-fragile.
        var winSize = await this.driver.getWindowSize();
        var x = Math.round(winSize.width / 2);
        var y = Math.round(winSize.height * 0.15);
        await this.driver.performActions([{
            type: 'pointer',
            id: 'finger1',
            parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', duration: 0, x: x, y: y },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerUp', button: 0 },
            ],
        }]);
        await this.world.taxon.waitFor();
    }
    async chooseSpecies(name) {
        if (this.isIos()) {
            // XCUITest's `mobile: scroll` with a predicate is unreliable on
            // long lists (stops early even when the target exists). Drive
            // swipes manually until a row whose label matches `name` is
            // actually displayed, then tap it.
            var selector = `-ios predicate string:label CONTAINS '${name}'`;
            var winSize = await this.driver.getWindowSize();
            var x = Math.round(winSize.width / 2);
            var fromY = Math.round(winSize.height * 0.75);
            var toY = Math.round(winSize.height * 0.25);
            var displayed = false;
            for (var attempt = 0; attempt < 20 && !displayed; attempt++) {
                try {
                    var el = await this.driver.$(selector);
                    displayed = await el.isDisplayed();
                } catch (e) {
                    displayed = false;
                }
                if (displayed) break;
                await this.driver.performActions([{
                    type: 'pointer',
                    id: 'finger1',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', duration: 0, x: x, y: fromY },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerMove', duration: 300, x: x, y: toY },
                        { type: 'pointerUp', button: 0 },
                    ],
                }]);
                await this.driver.releaseActions();
            }
            if (!displayed) {
                throw new Error(`Could not scroll species "${name}" into view`);
            }
        } else {
            // UiAutomator scrolls the first scrollable view until the
            // target textContains match is realised in the hierarchy.
            var sel = `new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().textContains("${name}"))`;
            await this.driver.$(`android=${sel}`);
        }
        await this.clickByText(name);
        await this.world.taxon.waitFor();
    }

} 
module.exports = BrowseScreen