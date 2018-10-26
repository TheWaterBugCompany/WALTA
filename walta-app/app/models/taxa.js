exports.definition = {
	config: {
		columns: {
		    "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER", // Foreign key to sample database
			"taxonId": "INTEGER PRIMARY KEY",
			"taxonPhotoPath": "VARCHAR(255)"
		},
		adapter: {
			type: "sql",
			collection_name: "taxa",
			db_name: "samples",
			idAttribute: "taxonId"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			getTaxonId() {
				return this.get("taxonId");
			},
			getAbundance() {
				return parseInt(this.get("abundance").split("-")[0]);
			},

			setPhoto: function(blob) {
				var taxonPhotoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, `taxon_${this.get("sampleId")}_${this.get("taxonId")}`);
				if ( taxonPhotoPath.write(blob) === false )
					alert("Error writing file");
				this.set( "taxonPhotoPath", taxonPhotoPath.nativePath );
				taxonPhotoPath = null;
			},

			getPhoto: function() {
				if ( this.get("taxonPhotoPath") ) {
					var taxonPhotoPath = Ti.Filesystem.getFile(this.get("taxonPhotoPath"));
					return taxonPhotoPath.read();
				}
			},

			toCerdiApiJson() {
				return {
					"count": this.getAbundance(),
					"creature_id": this.getTaxonId()
				};
			},

			destroy: function() {
				if ( this.get("taxonPhotoPath") ) {
					var taxonPhotoPath = Ti.Filesystem.getFile(this.get("taxonPhotoPath"));
					if ( taxonPhotoPath.deleteFile() === false )
						Ti.API.warn(`Unable to delete file ${taxonPhotoPath.nativePath}`);
				}
				Model.prototype.destroy.apply(this, arguments);
			}
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			toCerdiApiJson() {
				return this.map( (taxon) => taxon.toCerdiApiJson() );
			},
			loadCurrent() {
				this.fetch({ query: "SELECT * FROM taxa WHERE sampleId = (SELECT sampleId FROM sample WHERE dateCompleted IS NULL)"} );
			},
			load( sampleId ) {
				this.fetch({ query: `SELECT * FROM taxa WHERE sampleId = ${sampleId}`} );
			}
		});

		return Collection;
	}
};
