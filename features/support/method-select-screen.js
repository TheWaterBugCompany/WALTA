const BaseScreen = require('./base-screen');
class MethodSelectScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Select Method");
    }
    async viaKey() {
        await this.click('Key');
        await this.world.keySearch.waitFor();
    }
    async viaBrowse() {
        await this.click('Browse');
        await this.world.browse.waitFor();
    }
    async viaSpeedbug() {
        await this.click('Speedbug');
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
