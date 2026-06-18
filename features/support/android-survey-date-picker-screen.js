const BaseScreen = require('./base-screen');

// Drives the Android survey-date picker — the native showDatePickerDialog
// (Material calendar). Switches the header to the year list to jump to the
// target year, then navigates months and taps the day, before confirming.
class AndroidSurveyDatePickerScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = 'android=new UiSelector().resourceIdMatches("android:id/(date_picker_header|datePicker)")';
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, "Android date picker dialog did not appear" );
    }

    // date: { day: "15", month: "March", year: "2024", monthYear: "March 2024" }
    async selectDate( date ) {
        require('fs').writeFileSync('/tmp/android-date-picker.xml', await this.driver.getPageSource()); // TEMP diagnostic
        // Tap the year in the header to open the year list, choose the year.
        await this.clickRaw('android=new UiSelector().resourceId("android:id/date_picker_header_year")');
        await this.clickRaw(`android=new UiSelector().text("${date.year}")`);
        // Navigate to the target month, then tap the day.
        await this.clickRaw(`android=new UiSelector().descriptionContains("${date.day}").clickable(true)`);
        await this.clickRaw('android=new UiSelector().resourceId("android:id/button1")'); // OK
    }
}
module.exports = AndroidSurveyDatePickerScreen;
