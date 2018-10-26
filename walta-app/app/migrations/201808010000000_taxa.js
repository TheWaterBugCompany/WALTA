migration.up = function(migrator) {
    migrator.createTable({
        columns: {
            "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER",
			"taxonId": "INTEGER PRIMARY KEY",
        },
    });
};

migration.down = function(migrator) {
    migrator.dropTable();
};

