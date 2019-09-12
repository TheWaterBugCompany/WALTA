const BaseScreen = require('./base-screen');
class BrowseScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        if ( this.isIos() ) {
            this.presenceSelector = "XCUIElementTypeTable";
        } else {
            this.presenceSelector = this.selector("Browse");
        }
    }
    async quickSelectFirst() {
        await this.driver.touchAction([{action:"tap",x:25,y:9}]);
    }
    async chooseSpecies(name) {
        /* IOS - use platform specific query to imporve performance ??
            var el = await this.driver.$("XCUIElementTypeTable");
            el = await el.$(`-ios predicate string:type == "XCUIElementTypeCell" AND name == "${name}"`);
            el.click(); */
        await this.clickByText(name);
        await world.taxon.waitFor();
    }

} 
module.exports = BrowseScreen