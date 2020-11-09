migration.up = function(migrator) {
    Ti.API.info("migration 202010290015500_sample up()");
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN serverSitePhotoId INTEGER;');
};

migration.down = function(migrator) {
    Ti.API.info("migration 202010290015500_sample down()");
    var db = migrator.db;
    var table = migrator.table;
    db.execute('CREATE TEMPORARY TABLE samples_backup(serverSampleId,lastError,sampleId,dateCompleted,lat,lng,accuracy,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants,sitePhotoPath,uploaded,updatedAt);');
    db.execute('INSERT INTO samples_backup SELECT serverSampleId,lastError,sampleId,dateCompleted,lat,lng,accuracy,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants,sitePhotoPath,uploaded,updatedAt FROM ' + table + ';');
    migrator.dropTable();
    migrator.createTable({
        columns: {
            "serverSampleId": "INTEGER",
            "lastError": "VARCHAR(255)",
            "sampleId": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "dateCompleted": "VARCHAR(255)",
            "lat": "DECIMAL(3,5)",
            "lng": "DECIMAL(3,5)",
            "accuracy":  "DECIMAL(3,5)",
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
            "edgePlants": "INTEGER",
            "sitePhotoPath": "VARCHAR(255)",
            "uploaded": "INTEGER",
            "updatedAt": "INTEGER"
        }
    });
    db.execute('INSERT INTO ' + table + ' SELECT serverSampleId,lastError,sampleId,dateCompleted,lat,lng,accuracy,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants,sitePhotoPath,uploaded,updatedAt FROM samples_backup;');
    db.execute('DROP TABLE samples_backup;');
};
