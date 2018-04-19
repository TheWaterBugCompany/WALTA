require('specs/lib/ti-mocha');
var { expect } = require('specs/lib/chai');
var SampleDatabase = require('logic/SampleDatabase');

describe( 'Sample model', function() {
  context('SampleDatabase', function() {
    beforeEach( function() {
      var dbFile = Ti.Filesystem.getFile(SampleDatabase.DATABASE_FILE_NAME);
      if ( dbFile.exists() ) {
        if (! dbFile.deleteFile() ) {
          throw new Error(`Unable to delete ${SampleDatabase.DATABASE_FILE_NAME}`);
        }
      }
    });

    context('#load', function() {
      it('should start with an empty database', function() {
        SampleDatabase.load();
        expect( SampleDatabase.samples().length ).to.equal(0);
      });
      it('should load the last non completed sample');
      it('should create a new sample if no incomplete sample exists');
    });

    context("#newSample", function() {

      it('should default date to NULL');
      it('should set the data when a sample is marked complete');
      it('should fetch the current incomplete sample');
    });

  });
  context('Sample model', function() {
    it('should store a taxonId');
    it('should store a multiplicity');
  });
});
