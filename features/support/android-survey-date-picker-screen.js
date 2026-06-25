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

    // Bring the target year into view and tap it. UiScrollable.scrollIntoView
    // resets to the top of the (~1900+) list first and crawls back down — slow.
    // The list opens centred on the current year, so scroll straight toward the
    // target (earlier years sit above) and tap once it renders.
    async scrollToYear( year, currentYear ) {
        const yearSelector = `android=new UiSelector().text("${year}")`;
        const direction = parseInt( year, 10 ) <= currentYear ? "up" : "down";
        for ( let guard = 0; guard < 24; guard++ ) {
            const cell = await this.driver.$( yearSelector );
            if ( await cell.isExisting() ) {
                await cell.click();
                return;
            }
            const list = await this.driver.$('android=new UiSelector().resourceIdMatches(".*:id/mtrl_calendar_year_selector_frame")');
            await this.driver.execute( "mobile: scrollGesture", {
                elementId: list.elementId, direction, percent: 0.8,
            });
        }
        throw new Error(`date picker year ${year} not reachable`);
    }

    // date: { day: "15", month: "March", year: "2024" }
    async selectDate( date ) {
        // Read the currently-shown year before expanding, so we know which way
        // to scroll the year list.
        const currentYear = parseInt( (await (await this.driver.$( this.toggleSelector )).getText()).split(' ')[1], 10 );
        await this.clickRaw( this.toggleSelector );  // expand the year list
        await this.scrollToYear( date.year, currentYear );

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
