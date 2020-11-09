migration.up = function(migrator) {
    Ti.API.info("migration 201808010000000_taxa up()");
    migrator.createTable({
        columns: {
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
			"taxonId": "INTEGER PRIMARY KEY",
        }
    });
};

migration.down = function(migrator) {
    Ti.API.info("migration 201808010000000_taxa down()");
    migrator.dropTable();
};

