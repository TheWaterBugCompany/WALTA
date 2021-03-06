var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var moment = require("lib/moment");
var Sample = require("logic/Sample");
var { removeFilesBeginningWith } = require('logic/FileUtils');

function makeUserFilter(serverUserId) {
	if ( serverUserId ) {
		return `= ${serverUserId}`;
	} else {
		return`IS NULL`;
	}
}

exports.definition = {
	config: {
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
			"serverSitePhotoId": "INTEGER", // null if not on server
			"sitePhotoPath": "VARCHAR(255)",
			"serverSyncTime": "INTEGER", // timestamp of last upload or download (or 1 for legacy code)
			"updatedAt": "INTEGER", // timestamp of the last update (or NULL for legacy)
			"serverUserId": "INTEGER", // user_id field from CERDI server
		},
		adapter: {
			type: "sql",
			collection_name: "sample",
			db_name: "samples",
			idAttribute: "sampleId"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			
			initialize: function() {
				/*this.on('change', function(a,event) {
					if ( event && !event.ignore ) {
						//Ti.API.info(`change ${_.keys(event.changes)}`);
						// The list of fields that trigger setting updateAt
						// we don't want setting metadata to do this
						let dataFields = [
							"dateCompleted",
							"lat",
							"lng",
							"accuracy",
							"surveyType",
							"waterbodyType",
							"waterbodyName",
							"nearbyFeature",
							"boulder",
							"gravel",
							"sandOrSilt",
							"leafPacks",
							"wood",
							"aquaticPlants",
							"openWater",
							"edgePlants",
							"sitePhotoPath"
						]
						if (_.intersection(_.keys(event.changes),dataFields).length > 0) {
							
								
							_.defer(() => {
								let updatedAt = moment().valueOf();
								Ti.API.info(`setting updatedAt = ${updatedAt} id = ${this.get("serverSampleId")} `)
								this.set('updatedAt', updatedAt, {ignore:true});
								this.save(); 
							});
						}
					}
				});*/
			},
			isComplete: function() {
				var dateCompleted = this.get("dateCompleted");
				if ( ! dateCompleted )
					return false;
				else
					return true;
			},

			setLocation: function( coords ) {
				this.set('lat', coords.latitude);
				this.set('lng', coords.longitude);
				this.set('accuracy', coords.accuracy);
			},

			setSitePhoto: function(...file) {
				var newPhotoName = `sitePhoto_${this.get("sampleId")}_${moment().unix()}.jpg`;
				log(`updating photo ${file} to ${newPhotoName}`);
				removeFilesBeginningWith(`sitePhoto_${this.get("sampleId")}_`);
				var sitePhotoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, newPhotoName);
				Ti.Filesystem.getFile(...file).move(sitePhotoPath.nativePath);
				this.set( "sitePhotoPath", sitePhotoPath.nativePath );
				this.set( "serverSitePhotoId", null); // indicates this photo hasn't been uploaded yet
			},

			getSitePhoto: function() {
				return this.get("sitePhotoPath");
			},
			
			saveCurrentSample: function() {
				// If the serverSampleId has been set then this is an edited sample
				// and we need to remove the original
				let originalSampleId = this.get("originalSampleId");
				if ( originalSampleId ) {
					let oldSample = Alloy.createModel("sample");
					oldSample.loadById(originalSampleId);
					let oldTaxa = oldSample.loadTaxa();
					oldTaxa.removeAll({keepFiles:true});
					oldSample.destroy();
				}

				this.set("dateCompleted", moment().format() );
				let updatedAt = moment().valueOf();
				this.set('updatedAt', updatedAt, {ignore:true});
				this.set('originalSampleId', null);
				this.save();
			},

			loadCurrent() {
				return new Promise( (resolve,reject) =>
					this.fetch({ 
						query: "SELECT * FROM sample WHERE dateCompleted IS NULL AND serverSampleId IS NULL",
						success: resolve, 
						error: reject
					}));
			},

			loadById(sampleId) {
				return new Promise( (resolve,reject) =>
					this.fetch({ 
						query: `SELECT * FROM sample WHERE sampleId = ${sampleId}`,
						success: resolve, 
						error: reject
					}));
			},
			
			// only excludes loading any temporary edit that have not yet been persisted
			loadByServerId(serverSampleId ) {
				return new Promise( (resolve,reject) =>
					this.fetch({ 
						query: `SELECT * FROM sample WHERE serverSampleId = ${serverSampleId} AND (dateCompleted IS NOT NULL)`, 
						success: resolve, 
						error: reject })
				);
			},

			loadTaxa() {
				let taxa = Alloy.createCollection("taxa");
				let sampleId = this.get("sampleId");
				if ( sampleId )
					taxa.load( sampleId );
				return taxa;
			},


			lookUpSignalScore(t,key) {
				let taxon = key.findTaxonById( t.getTaxonId()  )
				if ( taxon ) {
					return taxon.signalScore;
				} else {
					return 0;
				}
			},

			calculateSignalScore(taxa,key) {
				var count = 0;
				return (taxa.reduce( (acc,t) => {
						count++;
						return acc+this.lookUpSignalScore(t,key);
					}, 0)/count).toFixed(1);
			},

			calculateWeightedSignalScore(taxa,key) {
				var count = 0;
				
				return (taxa.reduce( (acc,t) => {
					var n = t.getAbundance();
					count += n;
					return acc+this.lookUpSignalScore(t,key)*n;
				}, 0)/count).toFixed(1);
			},

			transform: function() { 
				var sampleJson = this.toJSON();
				var taxa = this.loadTaxa();

				if ( sampleJson.lat )
					sampleJson.lat = parseFloat(sampleJson.lat).toFixed(5);
				if ( sampleJson.lng )
					sampleJson.lng = parseFloat(sampleJson.lng).toFixed(5);

				sampleJson.score = this.calculateSignalScore(taxa,Alloy.Globals.Key);
				sampleJson.w_score = this.calculateWeightedSignalScore(taxa,Alloy.Globals.Key);
				sampleJson.siteInfo = sampleJson.waterbodyName;
				if ( sampleJson.nearbyFeature )
					sampleJson.siteInfo += ` @ ${sampleJson.nearbyFeature}`;


				sampleJson.surveyType = Sample.surveyTypeToString( parseInt( sampleJson.surveyType ) );
					
				if ( sampleJson.dateCompleted ) {
					sampleJson.dateCompleted = moment(sampleJson.dateCompleted).format("DD/MMM/YYYY h:mm:ss a");
				} else {
					sampleJson.dateCompleted = moment().format("DD/MMM/YYYY h:mm:ss a");
				}

				// Calculate progress 
				let count = 0, uploaded = 0;
				taxa.forEach( t => {
					count ++;
					if ( t.isUploaded() )
						uploaded++;
				})
				let progress, percentagePhotos;
				if ( count == 0 ) {
					percentagePhotos = 100
				} else {
					percentagePhotos = uploaded*100/count
				}
				if ( sampleJson.serverSyncTime >= sampleJson.updatedAt &&  percentagePhotos >= 100) {
					progress = "Finished";
				} else {
					progress = `${percentagePhotos.toFixed()}%`;
				}

				sampleJson.uploaded = progress;
				sampleJson.id = this.get("serverSampleId");
				// Provide textual assessment information
				function scoreColor(score) {
					if ( score <= 4.0 ) {
						return "#ff6161";
					} else if ( score <= 5.0 ) {
						return "#ffc000";
					} else if ( score <= 6.0 ) {
						return "#99930d";
					} else if ( score > 6.0) {
						return "#5ea90d";
					}
				}

				sampleJson.scoreColor = scoreColor( sampleJson.score);
				sampleJson.w_scoreColor = scoreColor( sampleJson.w_score);
				var scoreDiff = sampleJson.score  - sampleJson.w_score;

				if ( sampleJson.score <= 4.0 ) {
					sampleJson.impactText = "Unfortunately your site is heavily impacted.";
				} else if ( sampleJson.score <= 5.0 ) {
					sampleJson.impactText = "Your site is impacted.";
				} else if ( sampleJson.score <= 6.0 ) {
					sampleJson.impactText = "Your site is probably mildly polluted.";
				} else if ( sampleJson.score > 6.0 ) {
					sampleJson.impactText = "Your site is probably healthy.";
				}
				
				if ( scoreDiff > 2  && sampleJson.score > 6.0 ) {
					sampleJson.impactText += "\n\nIt is scoring less with the weighted SIGNAL because there are many more tolerant animals than sensitive ones ....perhaps there is some nutrient enrichment at the site?";
				}

				if ( taxa.length < 5 ) {
					if ( sampleJson.score > 5.0 ) {
						sampleJson.impactText += "\n\nIt might have suffered from a recent flood or some other abrupt impact.";
					}
				} else if ( taxa.length > 15 ) {
					if ( sampleJson.score > 6.0 ) {
						sampleJson.impactText += "\n\nIt has a great diversity of waterbugs.";
					} else {
						sampleJson.impactText += "\n\nIt has lots of different waterbugs.";
					}
				}

				sampleJson.taxaCount = taxa.length;
				return sampleJson;
			},

			fromCerdiApiJson: function(sample) {
				var taxa = this.loadTaxa();
				function toSurveyType(surveyType) {
					if ( surveyType === "detailed")
						return Sample.SURVEY_DETAILED;
					else if ( surveyType === "quick")
						return Sample.SURVEY_ORDER;
					else if ( surveyType === "mayfly")
						return Sample.SURVEY_MAYFLY;
				}
				function toWaterbodyType(waterbodyType) {
					if ( waterbodyType === "river")
						return Sample.WATERBODY_RIVER;
					else if ( waterbodyType === "wetland")
						return Sample.WATERBODY_WETLAND;
					else if ( waterbodyType === "lake")
						return Sample.WATERBODY_LAKE;
				}
				var updatedFields = {
					"serverUserId": sample.user_id,
					"serverSampleId": sample.id,
					"dateCompleted": sample.sample_date,
					"lat": parseFloat(sample.lat),
					"lng": parseFloat(sample.lng),
					"surveyType": toSurveyType(sample.survey_type),
					"waterbodyType": toWaterbodyType(sample.waterbody_type),
					"waterbodyName": sample.waterbody_name,
					"nearbyFeature": sample.nearby_feature,
					"boulder": sample.habitat.boulder,
					"gravel": sample.habitat.gravel,
					"wood": sample.habitat.wood
				};
				// In order to fix corrupted data - if the server has a null set
				// then do not overwrite existing data. (Only needed for attrbiutes with two words)
				let needToReupload = false;
				[ ["sand_or_silt", "sandOrSilt"], 
				  ["leaf_packs", "leafPacks"], 
				  ["aquatic_plants", "aquaticPlants"], 
				  ["open_water", "openWater"], 
				  ["edge_plants", "edgePlants"] ]
					.forEach( ([cerdiField, waltaField]) => {
						let value = sample.habitat[cerdiField];
						if ( _.isNull(value) ) {
							needToReupload = true;
						} else {
							updatedFields[waltaField] = value;
						}
					});
				if ( needToReupload ) {
					// plus 1 to avoid serverSyncTime ever equalling
					// updatedAt; this ensures an upload will be
					// scheduled.
					this.set("updatedAt", moment().valueOf() + 1);
				}

				if ( Object.keys(updatedFields).length > 0 ) {
					this.set(updatedFields);
				}
				
				// needs a sampleId before added taxa
				this.save(); 
				// payload on read is sampled_creatures but on create is creatures
				let creatures = (sample.creatures?sample.creatures:sample.sampled_creatures);
				taxa.fromCerdiApiJson(creatures, this.get("sampleId"));
				
			},

			toCerdiApiJson: function() {
				var taxa = this.loadTaxa();
				
				var attrs = {
					"sample_date": this.get("dateCompleted"),
					"lat": parseFloat(this.get("lat")).toFixed(5),
					"lng": parseFloat(this.get("lng")).toFixed(5),
					"scoring_method": "alt",
					"survey_type": [ "mayfly", "quick", "detailed" ][this.get("surveyType")],
					"waterbody_type": [ "river", "wetland", "lake" ][this.get("waterbodyType")],
					"waterbody_name": this.get("waterbodyName"),
					"nearby_feature": this.get("nearbyFeature"),
					"creatures": taxa.toCerdiApiJson(),
					"habitat": {
						"boulder": this.get("boulder"),
						"gravel": this.get("gravel"),
						"sand_or_silt": this.get("sandOrSilt"),
						"leaf_packs": this.get("leafPacks"),
						"wood": this.get("wood"),
						"aquatic_plants": this.get("aquaticPlants"),
						"open_water": this.get("openWater"),
						"edge_plants": this.get("edgePlants")
					 } 
				};
				
				if (this.get("serverSampleId") ) {
					attrs["id"] = this.get("serverSampleId");
				}
				if ( this.get("serverUserId") ) {
					attrs["user_id"] = this.get("serverUserId");
				}
				return attrs; 
			},

			createTemporaryForEdit: function() {
				// Reuse the serialisation code to create 
				// a duplicate without the dateCompleted set.
				let json = this.toCerdiApiJson();
				delete json.sample_date;

				let dup = Alloy.createModel("sample");
				dup.fromCerdiApiJson(json);

				dup.set("originalSampleId",this.get("sampleId"));

				// accuracy isn't in the CERDI JSON currently
				dup.set("accuracy", this.get("accuracy"));

				// the photo paths aren't stored in the Cerdi JSON
				dup.set("sitePhotoPath", this.get("sitePhotoPath"));

				// we carry over the serverSyncTime to track when the last
				// download from the server was.
				dup.set("serverSyncTime", this.get("serverSyncTime"));

				// add photo related metadata to taxons
				let taxa = this.loadTaxa();
				let dupTaxa = dup.loadTaxa();
			
				dupTaxa.forEach( newTaxon => {
					let newTaxonId = newTaxon.get("taxonId");
					let oldTaxon = taxa.find( t => t.get("taxonId") == newTaxonId );
					newTaxon.set("taxonPhotoPath", oldTaxon.get("taxonPhotoPath"));
					newTaxon.set("serverCreaturePhotoId", oldTaxon.get("serverCreaturePhotoId"));
					newTaxon.save();
				});

				dup.save();
				return dup;
			},

			getTaxa: function() {
				return this.loadTaxa();
			}


		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, { 
			// Note sets the singleton sample (FIXME?)
			createNewSample: function(serverUserId) {
				log("Creating new sample...");
				Alloy.Models.sample = Alloy.createModel("sample");
				this.add(Alloy.Models.sample);
				Alloy.Models.sample.set("serverUserId",serverUserId);
				Alloy.Models.sample.save();
				
				Alloy.Collections.instance("taxa").removeAllTemporary({keepFiles:true});
				Alloy.Collections.instance("taxa").reset();
			},

			startNewSurveyIfComplete: function(type,serverUserId) {
				if (    Alloy.Models.sample.get("dateCompleted") 
					 || !Alloy.Models.sample.get("sampleId") )  {
					 this.createNewSample(serverUserId);
					 Alloy.Models.sample.set({"surveyType": type} );
				}
			},

			loadUploadQueue: function(serverUserId) {
				this.fetch( { query: `SELECT * FROM sample WHERE (dateCompleted IS NOT NULL) AND (serverUserId ${makeUserFilter(serverUserId)} OR serverSampleId IS NULL) ORDER BY dateCompleted DESC`});
			},

			loadSampleHistory: function(serverUserId) {
				
				this.fetch({ query: `SELECT * FROM sample WHERE dateCompleted IS NOT NULL AND (serverUserId ${makeUserFilter(serverUserId)} OR serverSampleId IS NULL) ORDER BY dateCompleted DESC` } );
			}
		});

		return Collection;
	}
};
