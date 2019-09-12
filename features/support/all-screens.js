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
    world.swipeRight = swipeRight;
    world.swipeLeft = swipeLeft;
}

async function swipeRight( world, { start_x=30, end_x=0.95 } = {} ) {
    let size = await world.driver.getWindowSize();
    await world.driver.touchAction([ 
        {action: 'press', x: start_x, y: size.height/2},
        {action: 'wait',  ms: 1000  },
        {action: 'moveTo', x: size.width*end_x, y: size.height/2},
        'release']);
}
async function swipeLeft(world) {
    let size = await world.driver.getWindowSize();
    await world.driver.touchPerform([ 
        {action: 'press', options: {x: size.width*0.60, y: size.height/2}},
        {action: 'wait', options:{ ms: 100 } },
        {action: 'moveTo', options: {x: 4, y: size.height/2}},
        {action:'release'}]);
}

exports.setUpWorld = setUpWorld;
exports.swipeRight = swipeRight;