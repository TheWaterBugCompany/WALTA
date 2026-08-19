'use strict';
const BaseScreen = require('./base-screen');

class TrainingSuccessScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("training_success_message");
    }

    async finish() {
        await this.click("training_success_finish");
        await this.world.menu.waitFor();
    }
}
module.exports = TrainingSuccessScreen;
