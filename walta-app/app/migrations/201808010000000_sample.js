migration.up = function(migrator) {
    migrator.createTable({
        columns: {
            "serverSampleId": "INTEGER",
			"lastError": "VARCHAR(255)",
		    "sampleId": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"dateCompleted": "INTEGER",
			"lat": "DECIMAL(3,5)",
			"lng": "DECIMAL(3,5)",
			"surveyType": "INTEGER",
			"waterbodyType": "INTEGER",
			"waterbodyName": "VARCHAR(255)",
			"nearbyFeature": "VARCHAR(255)",
			"boulder": "INTEGER",
			"gravel": "INTEGER",
			"sandOrSilt": "INTEGER",
			"leafPacks": "INTEGER",
			"wood": "INTEGER",
			"aquaticPlants": "INTEGER",
			"openWater": "INTEGER",
			"edgePlants": "INTEGER"
        }
    });
};

migration.down = function(migrator) {
       migrator.dropTable();
};
