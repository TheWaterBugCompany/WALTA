migration.up = function(migrator) {
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

// realluy don't want to do this, as data is lost!!!
migration.down = function(migrator) {
    throw new Error("Migration down() not supported");
    /*
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
    db.execute('DROP TABLE ${table}_old;');
    */
};
