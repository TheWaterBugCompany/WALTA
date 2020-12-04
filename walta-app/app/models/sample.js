var Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var moment = require("lib/moment");
var Sample = require("logic/Sample");
var { removeFilesBeginningWith } = require('logic/FileUtils');
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
				this.on('change', function(a,event) {
					
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
								//Ti.API.info("setting updatedAt")
								this.set('updatedAt', moment().valueOf(), {ignore:true});
								this.save(); 
							});
						}
					}
				});
			},
			isReadOnly: function() {
				/*var dateCompleted = this.get("dateCompleted");
				if ( ! dateCompleted )
					return;

				var expireAt = moment( dateCompleted ).add(14, 'days');
				var now = moment();
				var readOnly = expireAt < now;
				return readOnly;*/
				return false;
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
			},

			getSitePhoto: function() {
				return this.get("sitePhotoPath");
			},
			
			saveCurrentSample: function() {
				//Ti.API.info("entering saveCurrentSample")
				this.set("dateCompleted", moment().format() );
				//Ti.API.info("calling save()")
				this.save();
			},

			loadCurrent(alsoLoadTaxon = true) {
				this.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NULL"});
				let sampleId = this.get("sampleId");
				if ( sampleId && alsoLoadTaxon ) {
					Alloy.Collections.instance("taxa").load(sampleId);
				} else {
					Alloy.Collections.instance("taxa");
				}
			},

			loadById(sampleId, alsoLoadTaxon = true) {
				this.fetch({ query: `SELECT * FROM sample WHERE sampleId = ${sampleId}` });
				if ( alsoLoadTaxon) Alloy.Collections.instance("taxa").load(sampleId);
			},
			
			loadByServerId(serverSampleId, alsoLoadTaxon = true) {
				this.fetch({ query: `SELECT * FROM sample WHERE serverSampleId = ${serverSampleId}` });
				let sampleId  = this.get("sampleId");
				if ( sampleId && alsoLoadTaxon) {
					Alloy.Collections.instance("taxa").load(this.get("sampleId"));
					return true;
				} else {
					return false;
				}
			},

			loadTaxa() {
				let taxa = Alloy.createCollection("taxa");
				let sampleId = this.get("sampleId");
				if ( sampleId )
					taxa.load( sampleId );
				return taxa;
			},


			calculateSignalScore(taxa,key) {
				var count = 0;
				return (taxa.reduce( (acc,t) => {
						count++;
						var score = key.findTaxonById( t.getTaxonId()  ).signalScore;
						return acc+score;
					}, 0)/count).toFixed(1);
			},

			calculateWeightedSignalScore(taxa,key) {
				var count = 0;
				
				return (taxa.reduce( (acc,t) => {
					var n = t.getAbundance();
					count += n;
					var score = key.findTaxonById( t.getTaxonId()  ).signalScore;
					return acc+score*n;
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
				sampleJson.uploaded = (sampleJson.uploaded > 0 ? "Yes" : "No" );

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
				this.set("serverSampleId", sample.id);
				this.set("dateCompleted", sample.sample_date);
				this.set("lat", sample.lat);
				this.set("lng", sample.lng);
				this.set("surveyType", toSurveyType(sample.survey_type));
				this.set("waterbodyType", toWaterbodyType(sample.waterbody_type));
				this.set("waterbodyName", sample.waterbody_name);
				this.set("nearbyFeature", sample.nearby_feature);
				this.set("boulder", sample.habitat.boulder);
				this.set("gravel", sample.habitat.gravel);
				// In order to fix corrupted data - if the server has a null set
				// then do not overwrite existing data. (Only needed for attrbiutes with two words)
				if ( sample.habitat.sand_or_silt ) {
					this.set("sandOrSilt", sample.habitat.sand_or_silt);
				}
				if ( sample.habitat.leaf_packs ) {
					this.set("leafPacks", sample.habitat.leaf_packs);
				}
			
				this.set("wood", sample.habitat.wood);

				if ( sample.habitat.aquatic_plants ) {
					this.set("aquaticPlants", sample.habitat.aquatic_plants);
				}

				if ( sample.habitat.open_water ) {
					this.set("openWater", sample.habitat.open_water);
				}
				
				if ( sample.habitat.edge_plants ) {
					this.set("edgePlants", sample.habitat.edge_plants);
				}
				// needs a sampleId before added taxa
				this.save(); 
				taxa.fromCerdiApiJson(sample.sampled_creatures, this.get("sampleId"));

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
					attrs["sampleId"] = this.get("serverSampleId");
				}
				return attrs;
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
			createNewSample: function() {
				log("Creating new sample..");
				Alloy.Models.sample = Alloy.createModel("sample");
				this.add(Alloy.Models.sample);
				Alloy.Models.sample.save();
				
				Alloy.Collections.instance("taxa").removeAllTemporary();
				Alloy.Collections.instance("taxa").reset();
			},

			startNewSurveyIfComplete: function(type) {
				if (    Alloy.Models.sample.get("dateCompleted") 
					 || !Alloy.Models.sample.get("sampleId") )  {
					 this.createNewSample();
					 Alloy.Models.sample.set({"surveyType": type} );
				}
			},

			load: function() {
				this.fetch();
				Alloy.Models.instance("sample").loadCurrent();
			},

			loadUploadQueue: function() {
				this.fetch( { query: "SELECT * FROM sample WHERE (dateCompleted IS NOT NULL)  ORDER BY dateCompleted DESC"});
			}
		});

		return Collection;
	}
};
