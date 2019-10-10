var moment = require("lib/moment");
var { removeFilesBeginningWith } = require('logic/FileUtils');
exports.definition = {
	config: {
		columns: {
			"sampleTaxonId": "INTEGER PRIMARY KEY AUTOINCREMENT",
		    "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER", // Foreign key to sample database
			"taxonId": "INTEGER", // Foreign "key" to taxon in key
			"taxonPhotoPath": "VARCHAR(255)"
		},
		adapter: {
			type: "sql",
			collection_name: "taxa",
			db_name: "samples",
			idAttribute: "sampleTaxonId"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			initialize() {
				this.on("change:sampleId", function() {
					// move from temporary to permanent storage
					let photoPath = this.get("taxonPhotoPath");
					if ( photoPath ) this.setPhoto(photoPath);
				});
			},
			getTaxonId() {
				return this.get("taxonId");
			},
			getAbundance() {
				var abundance = this.get("abundance");
				if ( abundance.startsWith(">")) return 30;
				let [ min, max ] = abundance.split("-").map((a) => parseInt(a) );
				return Math.round((min+max)/2);
			},

			setPhoto(file) {
				var newPhotoName;
				
				if ( ! this.get("sampleId") ) {
					newPhotoName = `taxon_temporary.jpg`;
					removeFilesBeginningWith(`taxon_temporary`);
				} else {
					newPhotoName = `taxon_${this.get("sampleId")}_${this.get("taxonId")}_${moment().unix()}.jpg`;
					removeFilesBeginningWith(`taxon_${this.get("sampleId")}_${this.get("taxonId")}_`);
				}
				
				Ti.API.info(`updating photo from ${file} to ${newPhotoName}`);
				var taxonPhotoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, newPhotoName);
				Ti.Filesystem.getFile(file).move(taxonPhotoPath.nativePath);
				this.set( "taxonPhotoPath", taxonPhotoPath.nativePath );
				
			},

			getPhoto() {
				return this.get("taxonPhotoPath");
			},

			getSilhouette: function() {
				var taxon = Alloy.Globals.Key.findTaxonById( this.getTaxonId() );
				var bluebug = taxon.bluebug;
				if ( bluebug !== undefined ) {
				  return bluebug[0];
				} else {
				  Ti.API.warn(`Warning: missing bluebug on ${this.getTaxonId()}`);
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
				Backbone.Model.prototype.destroy.apply(this, arguments);
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
			loadTemporary() {
				this.fetch({ query: `SELECT * FROM taxa WHERE (sampleId IS NULL)`} );
			},
			load( sampleId ) {
				this.fetch({ query: `SELECT * FROM taxa WHERE (sampleId = ${sampleId})`} );
			}
		});

		return Collection;
	}
};
