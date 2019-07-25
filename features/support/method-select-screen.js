const BaseScreen = require('./base-screen');
class MethodSelectScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "method_select_title";
    }
    async viaKey() {
        await this.click('submenu_key_button');
        await this.world.keySearch.waitFor();
    }
    async viaBrowse() {
        await this.click('submenu_browse_button');
        await this.world.browse.waitFor();
    }
    async viaSpeedbug() {
        await this.click('submenu_speedbug_button');
        await this.world.speedbug.waitFor();
    }
} 
module.exports = MethodSelectScreen


/*class MethodScreen extends Screen {
/*     def trait
      "* marked:'Select identification method:'"
    end

    def browse
        select("Browse")
        return page(BrowseScreen).await
    end

    def speedbug
        select("Speedbug")
        return page(SpeedbugScreen).await
    end
  
    def key
        select("Key")
        return page(QuestionScreen).await
    end */
