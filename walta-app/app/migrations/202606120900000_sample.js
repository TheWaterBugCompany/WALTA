migration.up = function(migrator) {
    Ti.API.debug("migration 202606120900000_sample up()");
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN overrideDateCompleted VARCHAR(255);');
};

migration.down = function(migrator) {
    Ti.API.debug("migration 202606120900000_sample down()");
    var db = migrator.db;
    var table = migrator.table;
    var cols = 'serverSampleId,lastError,sampleId,dateCompleted,lat,lng,accuracy,surveyType,waterbodyType,waterbodyName,nearbyFeature,boulder,gravel,sandOrSilt,leafPacks,wood,aquaticPlants,openWater,edgePlants,serverSitePhotoId,sitePhotoPath,serverSyncTime,updatedAt,serverUserId,originalSampleId,complete,notes';
    db.execute('CREATE TEMPORARY TABLE samples_backup(' + cols + ');');
    db.execute('INSERT INTO samples_backup SELECT ' + cols + ' FROM ' + table + ';');
    migrator.dropTable();
    migrator.createTable({
        columns: {
            "serverSampleId": "INTEGER",
            "lastError": "VARCHAR(255)",
            "sampleId": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "dateCompleted": "VARCHAR(255)",
            "lat": "DECIMAL(3,5)",
            "lng": "DECIMAL(3,5)",
            "accuracy": "DECIMAL(3,5)",
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
            "serverSitePhotoId": "INTEGER",
            "sitePhotoPath": "VARCHAR(255)",
            "serverSyncTime": "INTEGER",
            "updatedAt": "INTEGER",
            "serverUserId": "INTEGER",
            "originalSampleId": "INTEGER",
            "complete": "INTEGER",
            "notes": "TEXT"
        }
    });
    db.execute('INSERT INTO ' + table + ' SELECT ' + cols + ' FROM samples_backup;');
    db.execute('DROP TABLE samples_backup;');
};
