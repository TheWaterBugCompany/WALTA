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

async function swipeRight(world) {
    await world.driver.touchPerform([ 
        {action: 'press', options: {x: 4, y: 214}},
        {action: 'wait', options:{ ms: 500 } },
        {action: 'moveTo', options: {x: 700, y: 214}},
        {action:'release'}]);
}
async function swipeLeft(world) {
    await world.driver.touchPerform([ 
        {action: 'press', options: {x: 700, y: 214}},
        {action: 'wait', options:{ ms: 500 } },
        {action: 'moveTo', options: {x: 4, y: 214}},
        {action:'release'}]);
}

exports.setUpWorld = setUpWorld;
exports.swipeRight = swipeRight;