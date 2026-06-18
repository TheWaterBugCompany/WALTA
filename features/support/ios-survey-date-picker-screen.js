const BaseScreen = require('./base-screen');

// Drives the iOS survey-date picker — an inline-calendar Ti.UI.Picker inside
// the IosSurveyDatePicker Alloy modal, confirmed with its Done button. To pick
// a date in another month/year we expand the month/year header (reveals month
// + year wheels), set them, collapse, then tap the day cell.
class IosSurveyDatePickerScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "-ios class chain:**/XCUIElementTypeDatePicker";
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, "iOS survey date picker did not appear", 20000 );
    }

    // date: { day: "15", month: "March", year: "2024" }
    async selectDate( date ) {
        // Hold the header element handle across expand/collapse — its
        // accessibility name changes once expanded, so re-querying by name
        // would miss it.
        var header = await this.driver.$("-ios predicate string:name == 'Month'");
        await header.click();
        var monthWheel = await this.driver.$("-ios class chain:**/XCUIElementTypePickerWheel[1]");
        await monthWheel.waitForDisplayed({ timeout: 8000, timeoutMsg: "month/year wheels did not appear" });
        var wheels = await this.driver.$$("-ios class chain:**/XCUIElementTypePickerWheel");
        await wheels[0].addValue( date.month );
        await wheels[1].addValue( date.year );
        await header.click(); // collapse back to the day grid
        var day = await this.driver.$(`-ios predicate string:name CONTAINS '${date.day} ${date.month} ${date.year}' OR name CONTAINS '${date.day} ${date.month}'`);
        await day.waitForDisplayed({ timeout: 8000, timeoutMsg: `day cell '${date.day} ${date.month}' not found` });
        await day.click();
        await this.clickByText("Done");
    }
}
module.exports = IosSurveyDatePickerScreen;
