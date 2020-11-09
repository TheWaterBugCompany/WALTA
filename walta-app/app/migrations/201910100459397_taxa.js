migration.up = function(migrator) {
    Ti.API.info("migration 201910100459397_taxa up()");
    var db = migrator.db;
    var table = migrator.table;
    db.execute(`ALTER TABLE ${table} RENAME TO ${table}_old;`);
    migrator.createTable({
        columns: {
            "sampleTaxonId": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
            "taxonId": "INTEGER",
            "taxonPhotoPath": "VARCHAR(255)"
        }
    });
    db.execute(`INSERT INTO ${table} SELECT ROWID, abundance,sampleId,taxonId,taxonPhotoPath FROM ${table}_old;`);
    db.execute(`DROP TABLE ${table}_old`);
};

// Really don't want to do this in production, as data is lost!!!
// However, the database migration tests need to run the up() and down() migrations in order
// test migration correctly so we have this code here.
migration.down = function(migrator) {
    Ti.API.info("migration 201910100459397_taxa down()");
    var db = migrator.db;
    var table = migrator.table;
    db.execute(`ALTER TABLE ${table} RENAME TO ${table}_old;`);
    migrator.createTable({
        columns: {
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
			"taxonId": "INTEGER PRIMARY KEY",
            "taxonPhotoPath": "VARCHAR(255)"
        }
    });
    db.execute(`INSERT INTO ${table} SELECT abundance,sampleId,taxonId,taxonPhotoPath FROM ${table}_old;`);
    db.execute(`DROP TABLE ${table}_old;`);
};
