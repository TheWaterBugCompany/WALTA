const BaseScreen = require('./base-screen');

class NotesScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Notes");
    }

    async toggleSurveyComplete() {
        // iOS UISwitch exposes its value ("0"/"1") as `name`, masking the
        // accessibilityLabel — match by element type instead. The Notes
        // screen has a single Switch so this is unambiguous. Toggling
        // sets sample.complete = true (see Notes.js).
        if ( this.isIos() ) {
            await this.clickRaw("-ios predicate string:type == 'XCUIElementTypeSwitch'");
        } else {
            await this.click("Partial Submission");
        }
    }

    async setNotes( text ) {
        await this.enter("Notes", text);
    }

    // dateStr e.g. "15 March 2024"
    async setSurveyDate( dateStr ) {
        var [ day, month, year ] = dateStr.split(" ");
        await this.openSurveyDateField();
        await this.world.surveyDatePicker.waitFor();
        await this.world.surveyDatePicker.selectDate({ day, month, year });
    }

    async openSurveyDateField() {
        // The field exposes its date via accessibilityValue, so iOS folds the
        // value into the accessibility id ("Survey date. <date>.") and the
        // plain `~Survey date.` id selector no longer matches — open by label.
        if ( this.isIos() ) {
            await this.clickRaw("-ios predicate string:label == 'Survey date'");
        } else {
            await this.click("Survey date");
        }
    }

    async goNext() {
        await this.click("Next");
        await this.world.summary.waitFor();
    }

    async goBack() {
        await this.click("Back");
        await this.world.sample.waitFor();
    }
}
module.exports = NotesScreen;
