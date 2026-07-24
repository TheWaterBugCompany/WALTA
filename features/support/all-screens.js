const LoginScreen = require('./login-screen');
const MenuScreen = require('./menu-screen');
const BrowseScreen = require('./browse-screen');
const KeySearchScreen = require('./key-search-screen');
const MethodSelectScreen = require('./method-select-screen');
const TaxonScreen = require('./taxon-screen');
const SpeedbugScreen = require('./speedbug-screen');
const SampleScreen = require('./sample-screen.js');
const SiteDetailsScreen = require('./site-details-screen.js');
const HabitatScreen = require('./habitat-screen.js');
const GalleryScreen = require('./gallery-screen.js');
const EditTaxonScreen = require('./edit-taxon-screen.js');
const PhotoSelectScreen = require('./photo-select-screen.js');
const CameraScreen = require('./camera-screen.js');
const AboutScreen = require('./about-screen.js');
const HelpScreen = require('./help-screen.js');
const NotesScreen = require('./notes-screen.js');
const SummaryScreen = require('./summary-screen.js');
const ArchiveScreen = require('./archive-screen.js');
const SampleEditMenuScreen = require('./sample-edit-menu-screen.js');
const SyncFeedbackScreen = require('./sync-feedback-screen.js');
const createPhotoLibraryScreen = require('./photo-library-screen.js');
const createSurveyDatePickerScreen = require('./survey-date-picker-screen.js');
const AcademyScreen = require('./academy-screen.js');

function setUpWorld(world) {
    world.login = new LoginScreen( world );
    world.menu = new MenuScreen( world );
    world.keySearch = new KeySearchScreen( world );
    world.methodSelect = new MethodSelectScreen( world );
    world.browse = new BrowseScreen( world );
    world.taxon = new TaxonScreen( world );
    world.speedbug = new SpeedbugScreen( world );
    world.sample = new SampleScreen( world );
    world.siteDetails = new SiteDetailsScreen( world );
    world.habitat = new HabitatScreen( world );
    world.gallery = new GalleryScreen( world );
    world.editTaxon = new EditTaxonScreen( world) ;
    world.photoSelect = new PhotoSelectScreen( world );
    world.camera = new CameraScreen( world );
    world.about = new AboutScreen( world );
    world.help = new HelpScreen( world );
    world.notes = new NotesScreen( world );
    world.summary = new SummaryScreen( world );
    world.swipeRight = swipeRight;
    world.swipeLeft = swipeLeft;
    world.archive = new ArchiveScreen( world );
    world.sampleEditMenu = new SampleEditMenuScreen( world );
    world.syncFeedback = new SyncFeedbackScreen( world );
    world.photoLibrary = createPhotoLibraryScreen( world );
    world.surveyDatePicker = createSurveyDatePickerScreen( world );
    world.academy = new AcademyScreen( world );
}

async function swipeRight( world, { start_x=30, end_x=0.95 } = {} ) {
    let size = await world.driver.getWindowSize();
    await world.driver.performActions([{
        type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: start_x, y: Math.round(size.height / 2) },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 1000 },
            { type: 'pointerMove', duration: 300, x: Math.round(size.width * end_x), y: Math.round(size.height / 2) },
            { type: 'pointerUp', button: 0 },
        ],
    }]);
}
async function swipeLeft(world) {
    let size = await world.driver.getWindowSize();
    await world.driver.performActions([{
        type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: Math.round(size.width * 0.60), y: Math.round(size.height / 2) },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 1000 },
            { type: 'pointerMove', duration: 300, x: 4, y: Math.round(size.height / 2) },
            { type: 'pointerUp', button: 0 },
        ],
    }]);
}

exports.setUpWorld = setUpWorld;
exports.swipeRight = swipeRight;