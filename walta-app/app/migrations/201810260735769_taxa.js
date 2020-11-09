migration.up = function(migrator) {
    Ti.API.info("migration 201810260735769_taxa up()");
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN taxonPhotoPath VARCHAR(255);');
};

migration.down = function(migrator) {
    Ti.API.info("migration 201810260735769_taxa down()");
    var db = migrator.db;
    var table = migrator.table;
    db.execute('CREATE TEMPORARY TABLE taxa_backup(abundance,sampleId,taxonId);');
    db.execute('INSERT INTO taxa_backup SELECT abundance,sampleId,taxonId FROM ' + table + ';');
    migrator.dropTable();
    migrator.createTable({
        columns: {
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
			"taxonId": "INTEGER PRIMARY KEY",
        }
    });
    db.execute('INSERT INTO ' + table + ' SELECT abundance,sampleId,taxonId FROM taxa_backup;');
    db.execute('DROP TABLE taxa_backup;');
};

