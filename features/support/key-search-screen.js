const BaseScreen = require('./base-screen');

class KeySearchScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "keysearch_choose_best_match";
    }

    async chooseTop() {
      await this.click("question_top");
    }
    async chooseTopAndExpect(text) {
      await this.chooseTop();
      await this.waitForText(text);
    }
    async chooseBottom() {
      await this.click("question_bottom");
    }
    async chooseBottomAndExpect(text) {
      await this.chooseBottom();
      await this.waitForText(text);
    }
    async goBack() {
      await this.click("go_back_button");
    }
    async goBackAndExpect(text) {
      await this.goBack();
      await this.waitForText(text);
    }
} 
module.exports = KeySearchScreen;
/*class QuestionScreen extends Screen {
     def trait
      "* marked:'Choose the best match'"
    end

    def select_question( text )
      tap_mark(text)
    end

    def verify_questions( top, bottom )
      expect( query("ti.modules.titanium.ui.widget.TiUILabel$1 marked:'#{top}'") ).not_to be_empty
      expect( query("ti.modules.titanium.ui.widget.TiUILabel$1 marked:'#{bottom}'") ).not_to be_empty
    end */
