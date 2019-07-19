const LoginScreen = require('./login-screen');
const MenuScreen = require('./menu-screen');
const BrowseScreen = require('./browse-screen');
const KeySearchScreen = require('./key-search-screen');
const MethodSelectScreen = require('./method-select-screen');
const TaxonScreen = require('./taxon-screen');

function setUpWorld(world) {
    world.login = new LoginScreen( world );
    world.menu = new MenuScreen( world );
    world.keySearch = new KeySearchScreen( world );
    world.methodSelect = new MethodSelectScreen( world );
    world.browse = new BrowseScreen( world );
    world.taxon = new TaxonScreen( world );
}

module.exports.setUpWorld = setUpWorld;