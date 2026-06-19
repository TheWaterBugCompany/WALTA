const BaseScreen = require('./base-screen');

const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

// Drives the Android survey-date picker — the native Material date dialog
// raised by showDatePickerDialog. Jumps to the target year via the header
// year list, steps months to the target, taps the day, then confirms.
class AndroidSurveyDatePickerScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = 'android=new UiSelector().resourceIdMatches(".*:id/mtrl_calendar_frame")';
        this.toggleSelector = 'android=new UiSelector().resourceIdMatches(".*:id/month_navigation_fragment_toggle")';
    }

    async waitFor() {
        await this.waitForRaw( this.presenceSelector, "Android date picker dialog did not appear", 20000 );
    }

    // Header toggle reads "Month YYYY" (e.g. "June 2026"); collapse to a
    // single ordinal so months can be compared across year boundaries.
    monthOrdinal( label ) {
        const [ month, year ] = label.split(' ');
        return parseInt( year, 10 ) * 12 + MONTHS.indexOf( month );
    }

    // date: { day: "15", month: "March", year: "2024" }
    async selectDate( date ) {
        // Jump to the target year via the header year list. The list opens at
        // the current year and earlier years sit above it, so scroll back to
        // bring the target into view before tapping it.
        await this.clickRaw( this.toggleSelector );
        await this.clickRaw(
            'android=new UiScrollable(new UiSelector().resourceIdMatches(".*:id/mtrl_calendar_year_selector_frame"))' +
            `.scrollIntoView(new UiSelector().text("${date.year}"))`
        );

        // Step months until the header shows the target month/year.
        const target = this.monthOrdinal( `${date.month} ${date.year}` );
        for ( let guard = 0; guard < 24; guard++ ) {
            const toggle = await this.driver.$( this.toggleSelector );
            const current = this.monthOrdinal( await toggle.getText() );
            if ( current === target ) break;
            const dir = current > target ? "previous" : "next";
            await this.clickRaw(`android=new UiSelector().resourceIdMatches(".*:id/month_navigation_${dir}")`);
        }

        // Day cells expose a content-desc like "Friday, March 15".
        await this.clickRaw(`android=new UiSelector().descriptionContains("${date.month} ${date.day}")`);
        await this.clickRaw('android=new UiSelector().resourceIdMatches(".*:id/confirm_button")');
    }
}
module.exports = AndroidSurveyDatePickerScreen;
