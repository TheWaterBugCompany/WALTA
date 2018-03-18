require('specs/lib/ti-mocha');
var TestUtils = require('specs/util/TestUtils');
var Alloy = require('alloy');
describe( 'SampleTray', function() {
  it('should open', function(done) {
      var SampleTray = Alloy.createController("SampleTray");
      var win = TestUtils.wrapViewInWindow( SampleTray.getView() );
      win.addEventListener('open' , function() { done() } );
      win.open();
  })
});
