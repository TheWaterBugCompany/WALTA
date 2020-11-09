migration.up = function(migrator) {
    Ti.API.info("migration 202010300459397_taxa up()");
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN serverCreaturePhotoId INTEGER;');

};
migration.down = function(migrator) {
    Ti.API.info("migration 202010300459397_taxa down()");
    var db = migrator.db;
    var table = migrator.table;
    db.execute('CREATE TEMPORARY TABLE taxa_backup(sampleTaxonId,abundance,sampleId,taxonId,taxonPhotoPath);');
    db.execute('INSERT INTO taxa_backup SELECT sampleTaxonId,abundance,sampleId,taxonId,taxonPhotoPath FROM ' + table + ';');
    migrator.dropTable();
    migrator.createTable({
        columns: {
            "sampleTaxonId": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
            "taxonId": "INTEGER",
            "taxonPhotoPath": "VARCHAR(255)"
        }
    });
    db.execute(`INSERT INTO ${table} SELECT sampleTaxonId,abundance,sampleId,taxonId,taxonPhotoPath FROM ${table}_backup;`);
    db.execute(`DROP TABLE ${table}_backup`);
};
