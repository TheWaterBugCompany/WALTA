/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("unit-test/lib/ti-mocha");
var { use, expect } = require("unit-test/lib/chai");
use( require('unit-test/lib/chai-date-string') );
var moment = require("lib/moment");
var { makeTestPhoto, removeDatabase } = require("unit-test/util/TestUtils");
var Sample = require('logic/Sample');
var sql = require('/alloy/sync/sql');
var models = {};
var oldAlloyM = Alloy.M;
var oldBeforeModelCreate = sql.beforeModelCreate;
var oldAfterModelCreate = sql.afterModelCreate;

function undoMonkeyPatch() {
    Alloy.M = oldAlloyM;
    sql.beforeModelCreate = oldBeforeModelCreate;
    sql.afterModelCreate = oldAfterModelCreate;
}

function monkeyPatch() {
    // WARNING this is full of hack and relies on the internals of Alloy

    // intercept alloy model creation to defer it to later and allow us
    // capture the migrations list
    
    
    Alloy.M = function (name, definition, migrations ) {
        models[name] = {};
        models[name].definition = definition;
        models[name].migrations = migrations;
        return oldAlloyM(name, definition, migrations); 
    }

    // cache buster - add the time to the cache key so that
    // Models and configs are never actually cached.
    sql.beforeModelCreate = function(config, name) {
        return oldBeforeModelCreate( config, name + moment() );
    }

    sql.afterModelCreate = function(Model, name) {
        return oldAfterModelCreate( Model, name + moment() );
    }
}



function cloneDefinition(name) {
    var def = _.clone(models[name].definition);
    def.config = _.clone(def.config);
    def.config.columns = _.clone(def.config.columns);
    return def;
}

function upMigration(name, definition, migration ) {
    // set the migration to apply
    var migrations = models[name].migrations;
    definition.config.adapter.migration = migration;

    // let Alloy do its thing
    return oldAlloyM( name, definition, migrations );
}
 
// because of the wau this hacks Alloy, it doesn't play well others
describe.only("Database Migrations", function() {
    before(function() {
        // import models
        monkeyPatch();
        var taxaModel = require("/alloy/models/Taxa");
        var sampleModel = require("/alloy/models/Sample");
    });
    after(undoMonkeyPatch);
    context("Taxa", function() {
        before(function(){
            removeDatabase(models["taxa"].definition.config.adapter.db_name);
        })
        it("should apply 201808010000000_taxa migration", async function() {

            var def = {
                config: {
                    columns: {
                        "abundance": "VARCHAR(6)",
                        "sampleId": "INTEGER", // Foreign key to sample database
                        "taxonId": "INTEGER PRIMARY KEY", // Foreign "key" to taxon in key
                    },
                    adapter: {
                        type: "sql",
                        collection_name: "taxa",
                        db_name: "samples",
                        idAttribute: "taxonId"
                    }
                }
            };
        
            // creates database and applies migration
            var taxon = new (upMigration("taxa", def, "201808010000000" ))();
            taxon.set("sampleId", 666);
            taxon.set("taxonId", 1);
            taxon.set("abundance", "> 20");
            taxon.save(); 

            // clear object and load it to check persistence
            taxon.clear({silent:true});
            taxon.fetch({id:1});

            expect( taxon.get("taxonId") ).to.equal(1);
            expect( taxon.get("abundance") ).to.equal("> 20");
            expect( taxon.get("sampleId") ).to.equal(666);
        
        });

        // depends on previous database state
        it("should apply 201810260735769_taxa migration", async function() {

            var def = {
                config: {
                    columns: {
                        "abundance": "VARCHAR(6)",
                        "sampleId": "INTEGER", // Foreign key to sample database
                        "taxonId": "INTEGER PRIMARY KEY", // Foreign "key" to taxon in key
                        "taxonPhotoPath": "VARCHAR(255)"
                    },
                    adapter: {
                        type: "sql",
                        collection_name: "taxa",
                        db_name: "samples",
                        idAttribute: "taxonId"
                    }
                }
            };

            // save new structure taxon
            var taxon = new (upMigration("taxa", def, "201810260735769" ))();
            taxon.set("sampleId", 666);
            taxon.set("taxonId", 2);
            taxon.set("abundance", "1-2");
            taxon.set("taxonPhotoPath", makeTestPhoto("photo"));
            taxon.save(); 
            

            taxon.clear({silent:true});
            taxon.fetch({id:2});


            expect( taxon.get("taxonId") ).to.equal(2);
            expect( taxon.get("abundance") ).to.equal("1-2");
            expect( taxon.get("sampleId") ).to.equal(666);
            expect( taxon.get("taxonPhotoPath") ).to.include("photo");

            taxon.fetch({id:1});

            expect( taxon.get("taxonId") ).to.equal(1);
            expect( taxon.get("abundance") ).to.equal("> 20");
            expect( taxon.get("sampleId") ).to.equal(666);
            expect( taxon.get("taxonPhotoPath") ).to.be.null;
        
        });

        it("should apply 201910100459397_taxa migration", function() {
            var taxa = new (upMigration("taxa", models["taxa"].definition, "201910100459397" ))();
            taxa.set("sampleId", 668 );
            taxa.set("taxonId", 1);
            taxa.set("abundance", "> 20");
            taxa.set("taxonPhotoPath", makeTestPhoto("photo"));
            taxa.save();

            taxa.clear({silent:true});
            taxa.set("sampleId", 669 );
            taxa.set("taxonId", 1);
            taxa.set("abundance", "1-2");
            taxa.set("taxonPhotoPath", makeTestPhoto("photo2"));
            taxa.save();

            taxa.clear({silent:true});

            // ensure both rows exist independently
            taxa.fetch({query: `SELECT * FROM taxa WHERE sampleId = 669 AND taxonId = 1`});
            expect( taxa.get("abundance") ).to.equal("1-2");

            taxa.fetch({query: `SELECT * FROM taxa WHERE sampleId = 668 AND taxonId = 1`});
            expect( taxa.get("abundance") ).to.equal("> 20");
        });
    });

    context("Sample", function() {
        before(function(){
            removeDatabase(models["sample"].definition.config.adapter.db_name);
        })
        it("should apply 201808010000000_sample migration", function() {
            // modify defintion to suite old sample
            var def = cloneDefinition("sample");
            delete def.config.columns["sitePhotoPath"];
            delete def.config.columns["accuracy"];
            delete def.config.columns["uploaded"];

            // creates database and applies migration
            var sample = new (upMigration("sample", def, "201808010000000" ))();
            sample.set("serverSampleId", 1);
            sample.set("sampleId", 666);
            sample.set("lastError", "Test error");
            sample.set("dateCompleted", moment().format());
            sample.set("lat", -42.0 );
            sample.set("lng", 135.0 );
            sample.set("surveyType", Sample.SURVEY_DETAILED);
            sample.set("waterbodyType", Sample.WATERBODY_LAKE);
            sample.set("waterbodyName","Test Waterbody");
            sample.set("nearbyFeature", "near the office intersection cupboard");
            sample.set("boulder", 15 );
            sample.set("gravel", 14 );
            sample.set("sandOrSilt", 13 );
            sample.set("wood", 8 );
            sample.set("leafPacks", 17 );
            sample.set("aquaticPlants", 12 );
            sample.set("openWater", 11 );
            sample.set("edgePlants", 10 );
            sample.save(); 

            // clear object and load it to check persistence
            sample.clear({silent:true});
            sample.fetch({id:666});
            expect( sample.get("serverSampleId") ).to.equal(1);
            expect( sample.get("sampleId") ).to.equal(666);
            expect( sample.get("lastError") ).to.equal("Test error");
            expect( sample.get("dateCompleted")).to.be.a.dateString();
            expect( parseFloat(sample.get("lat")) ).to.equal(-42);
            expect( parseFloat(sample.get("lng")) ).to.equal(135);
            expect( sample.get("surveyType") ).to.equal(Sample.SURVEY_DETAILED);
            expect( sample.get("waterbodyType") ).to.equal(Sample.WATERBODY_LAKE);
            expect( sample.get("waterbodyName") ).to.equal("Test Waterbody");
            expect( sample.get("nearbyFeature") ).to.equal("near the office intersection cupboard");
            expect( sample.get("boulder") ).to.equal(15);
            expect( sample.get("gravel") ).to.equal(14);
            expect( sample.get("sandOrSilt") ).to.equal(13);
            expect( sample.get("wood") ).to.equal(8);
            expect( sample.get("leafPacks") ).to.equal(17);
            expect( sample.get("aquaticPlants") ).to.equal(12);
            expect( sample.get("openWater") ).to.equal(11);
            expect( sample.get("edgePlants") ).to.equal(10);
        });
        it("should apply 201810260721170_sample migration", function() {
             // modify defintion to suite old sample
             var def = cloneDefinition("sample");
             delete def.config.columns["accuracy"];
             delete def.config.columns["uploaded"];
             var sample = new (upMigration("sample", def, "201810260721170" ))();
             sample.fetch({id:666});
             expect( sample.get("sitePhotoPath") ).to.be.null;
             sample.set("sitePhotoPath", "/photo/path")
             sample.save();
             sample.clear({silent:true});
             sample.fetch({id:666});
             expect( sample.get("sitePhotoPath") ).to.be.include("/photo/path");
        });
        it("should apply 201810260933531_sample migration", function() {
            // modify defintion to suite old sample
            var def = cloneDefinition("sample");
            delete def.config.columns["accuracy"];
           
            var sample = new (upMigration("sample", def, "201810260933531" ))();
            sample.fetch({id:666});
            expect( sample.get("uploaded") ).to.equal(1);
            sample.set("uploaded", 0 )
            sample.save();
            sample.clear({silent:true});
            sample.fetch({id:666});
            expect( sample.get("uploaded") ).to.equal(0);
       });
        it("should apply 201903211031372_sample migration", function() {
            var sample = new (upMigration("sample", models["sample"].definition, "201903211031372" ))();
            sample.fetch({id:666});
            expect( sample.get("accuracy") ).to.be.null;
            sample.set("accuracy", 100 )
            sample.save();
            sample.clear({silent:true});
            sample.fetch({id:666});
            expect( sample.get("accuracy") ).to.equal(100);
        });
      
    });
});
