const LoginScreen = require('./screens/login-screen');
const MenuScreen = require('./screens/menu-screen');
const BrowseScreen = require('./screens/browse-screen');
const KeySearchScreen = require('./screens/key-search-screen');
const MethodSelectScreen = require('./screens/method-select-screen');
const TaxonScreen = require('./screens/taxon-screen');
const SpeedbugScreen = require('./screens/speedbug-screen');
const SampleScreen = require('./screens/sample-screen.js');
const SiteDetailsScreen = require('./screens/site-details-screen.js');
const HabitatScreen = require('./screens/habitat-screen.js');
const GalleryScreen = require('./screens/gallery-screen.js');
const PhotoViewerScreen = require('./screens/photo-viewer-screen.js');
const EditTaxonScreen = require('./screens/edit-taxon-screen.js');
const PhotoSelectScreen = require('./screens/photo-select-screen.js');
const CameraScreen = require('./screens/camera-screen.js');
const AboutScreen = require('./screens/about-screen.js');
const HelpScreen = require('./screens/help-screen.js');
const NotesScreen = require('./screens/notes-screen.js');
const SummaryScreen = require('./screens/summary-screen.js');
const ArchiveScreen = require('./screens/archive-screen.js');
const SampleEditMenuScreen = require('./screens/sample-edit-menu-screen.js');
const SyncFeedbackScreen = require('./screens/sync-feedback-screen.js');
const createPhotoLibraryScreen = require('./screens/photo-library-screen.js');
const createSurveyDatePickerScreen = require('./screens/survey-date-picker-screen.js');
const AcademyScreen = require('./screens/academy-screen.js');
const TrainingSuccessScreen = require('./screens/training-success-screen.js');
const TaxonComparisonScreen = require('./screens/taxon-comparison-screen.js');

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
    world.photoViewer = new PhotoViewerScreen( world );
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
    world.trainingSuccess = new TrainingSuccessScreen( world );
    world.taxonComparison = new TaxonComparisonScreen( world );
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