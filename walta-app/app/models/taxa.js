var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var moment = require("lib/moment");
var { removeFilesBeginningWith } = require('logic/FileUtils');
exports.definition = {
	config: {
		columns: {
			"sampleTaxonId": "INTEGER PRIMARY KEY AUTOINCREMENT",
		    "abundance": "VARCHAR(6)",
			"sampleId": "INTEGER", // Foreign key to sample database
			"taxonId": "INTEGER", // Foreign "key" to taxon in key
			"taxonPhotoPath": "VARCHAR(255)",
			"serverCreaturePhotoId": "INTEGER" // server side photo id
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
				
				/*this.on('change', function(a,event) {
					if ( event && !event.ignore ) {
						let dataFields = [
							"abundance",
							"taxonPhotoPath",
						]
						if (_.intersection(_.keys(event.changes),dataFields).length > 0) {
							Ti.API.info("changing!")
							let sampleId = this.get('sampleId');
							if ( sampleId ) {
								let sample = Alloy.createModel("sample");
								sample.loadById(sampleId, false);
								sample.set({ 'updatedAt': moment().valueOf() });
								sample.save();
							}
						}
					}
				});*/
			},
			getSampleId() {
				return this.get("sampleId");
			},
			getTaxonId() {
				return this.get("taxonId");
			},
			isUploaded() {
				return this.get("serverCreaturePhotoId") != null;
			},
			getAbundance() {
				var abundance = this.get("abundance");
				if ( abundance ) {
					if ( abundance.startsWith(">")) return 30;
					let [ min, max ] = abundance.split("-").map((a) => parseInt(a) );
					return Math.round((min+max)/2);
				} else {
					return undefined;
				}
			},
			convertCountToAbundance(count) {
				if ( count >= 1 && count < 3 ) {
					return "1-2";
				} else if ( count >= 3 && count < 6 ) {
					return "3-5";
				} else if ( count >= 6 && count < 11 ) {
					return "6-10";
				} else if ( count >= 11 && count <= 20 ) {
					return "11-20";
				} else {
					return "> 20";
				}
			},

			setPhoto(...file) {
				var photoFile = Ti.Filesystem.getFile(...file);
				var newPhotoName;	
				if ( ! this.get("sampleId") ) {
					newPhotoName = `taxon_temporary_${this.get("taxonId")}.jpg`;
					if ( photoFile.nativePath.endsWith(newPhotoName) )
						return;
					removeFilesBeginningWith(newPhotoName);
				} else {
					newPhotoName = `taxon_${this.get("sampleId")}_${this.get("taxonId")}_${moment().unix()}.jpg`;
					removeFilesBeginningWith(`taxon_${this.get("sampleId")}_${this.get("taxonId")}_`);
				}
				
				log(`updating photo from ${file} to ${newPhotoName}`);
				var taxonPhotoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, newPhotoName);
				photoFile.move(taxonPhotoPath.nativePath);
				this.set( "taxonPhotoPath", taxonPhotoPath.nativePath );
				this.set( "serverCreaturePhotoId", null); // indicates this photo hasn't been uploaded yet
				
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
				  log(`Warning: missing bluebug on ${this.getTaxonId()}`);
				}
			},

			fromCerdiApiJson(creature) {
				this.set( {
					taxonId: parseInt(creature.creature_id),
					abundance: this.convertCountToAbundance(creature.count)
				}, {ignore:true});
			},

			toCerdiApiJson() {
				return {
					"count": this.getAbundance(),
					"creature_id": this.getTaxonId()
				};
			},

			destroy: function(options) {
				let keepFiles = true;
				if ( options && options.keepFiles) {
					keepFiles = options.keepFiles;
				}
				if ( this.get("taxonPhotoPath") && !keepFiles ) {
					
					var taxonPhotoPath = Ti.Filesystem.getFile(this.get("taxonPhotoPath"));
					
					if ( taxonPhotoPath.deleteFile() === false )
						log(`Unable to delete file ${taxonPhotoPath.nativePath}`);
					else 
						log(`deleted taxon file ${taxonPhotoPath.nativePath}`)
				}
				Backbone.Model.prototype.destroy.apply(this, arguments);
			}
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			fromCerdiApiJson(creatures,sampleId) {
				_(creatures).forEach( creature => {
					let taxon = this.findTaxon(creature.creature_id);
					if ( !taxon ) {
						taxon = Alloy.createModel("taxa");
						taxon.set("sampleId", sampleId);
					}
					taxon.fromCerdiApiJson(creature);
					taxon.save();
					this.add(taxon);
				});
			},
			toCerdiApiJson() {
				return this.map( (taxon) => taxon.toCerdiApiJson() );
			},
			removeAll(options) {
				this.models.forEach( (t) => t.destroy(options) );
			},
			removeAllTemporary(options) {
				this.fetch({ query: `SELECT * FROM taxa WHERE sampleId IS NULL`} );
				this.models.forEach( (t) => t.destroy(options) );
			},
			findTaxon(taxon_id) {
				return this.find( (t) => t.get("taxonId") == taxon_id);
			},
			/*loadTaxonForSample(taxonId, sampleId) {
				this.fetch({ query: `SELECT * FROM taxa WHERE sampleId = ${sampleId} AND taxonId = ${taxonId}`} );
			},*/
			loadTemporary(taxonId) {
				this.fetch({ query: `SELECT * FROM taxa WHERE sampleId IS NULL AND taxonId = ${taxonId}`} );
			},
			load( sampleId ) {
				this.fetch({ query: `SELECT * FROM taxa WHERE (sampleId = ${sampleId})`} );
			}
		});

		return Collection;
	}
};
