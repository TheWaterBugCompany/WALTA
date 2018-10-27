migration.up = function(migrator) {
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN sitePhotoPath VARCHAR(255);');
};

migration.down = function(migrator) {
    var db = migrator.db;
    var table = migrator.table;
    db.execute('CREATE TEMPORARY TABLE samples_backup(serverSampleId,lastError,sampleId,dateCompleted,lat,lng,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants);');
    db.execute('INSERT INTO samples_backup SELECT serverSampleId,lastError,sampleId,dateCompleted,lat,lng,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants FROM ' + table + ';');
    migrator.dropTable();
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
    db.execute('INSERT INTO ' + table + ' SELECT serverSampleId,lastError,sampleId,dateCompleted,lat,lng,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants FROM samples_backup;');
    db.execute('DROP TABLE samples_backup;');
};
