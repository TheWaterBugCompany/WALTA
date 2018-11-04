var moment = require("lib/moment");
var Sample = require("logic/Sample");
var GeoLocationService = require('logic/GeoLocationService');
exports.definition = {
	config: {
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
			"edgePlants": "INTEGER",
			"sitePhotoPath": "VARCHAR(255)",
			"uploaded": "BOOLEAN"
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

			setSitePhoto: function(blob) {
				var sitePhotoPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, `sitePhoto_${this.get("sampleId")}.jpg`);
				if ( sitePhotoPath.write(blob) === false )
					alert("Error writing file");
				this.set( "sitePhotoPath", sitePhotoPath.nativePath );
				sitePhotoPath = null;
			},

			getSitePhoto: function() {
				if ( this.get("sitePhotoPath") ) {
					var sitePhotoPath = Ti.Filesystem.getFile(this.get("sitePhotoPath"));
					return sitePhotoPath.read();
				}
			},
			

			saveCurrentSample: function() {
				var taxa = Alloy.Collections.taxa;
				taxa.forEach( (t) => {
					t.set("sampleId", this.get("sampleId"));
					t.save();
				});
				this.set("dateCompleted", moment().format() );
				this.save();
				GeoLocationService.stop();
			},

			loadCurrent() {
				this.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NULL"});
			},

			loadTaxa() {
				var taxa = Alloy.createCollection("taxa");
				taxa.load( this.get("sampleId") );
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

				switch( parseInt( sampleJson.surveyType ) ) {
					case Sample.MAYFLY:
						sampleJson.surveyType = "Mayfly";
						break;
					case Sample.ORDER:
						sampleJson.surveyType = "Quick";
						break;
					case Sample.DETAILED:
						sampleJson.surveyType = "Detailed";
				} 

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
						"sandOrSilt": this.get("sandOrSilt"),
						"leafPacks": this.get("leafPacks"),
						"wood": this.get("wood"),
						"aquaticPlants": this.get("aquaticPlants"),
						"openWater": this.get("openWater"),
						"edgePlants": this.get("edgePlants")
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
			createNewSample: function() {
				Ti.API.info("Creating new sample..");
				Alloy.Models.sample = Alloy.createModel("sample");
				Alloy.Collections.taxa = Alloy.createCollection("taxa");
				this.add(Alloy.Models.sample);
				Alloy.Models.sample.save();
				Ti.API.info(`sampleId = ${Alloy.Models.sample.get("sampleId")}`);
			},

			startNewSurveyIfComplete: function(type) {
				if (    Alloy.Models.sample.get("dateCompleted") 
					 || !Alloy.Models.sample.get("sampleId")
				     || Alloy.Collections.sample.length == 0  )  {
					 this.createNewSample();
					 Alloy.Models.sample.set({"surveyType": type} );
				}
			},

			load: function() {
				this.fetch();
				Alloy.Models.instance("sample").loadCurrent();
				Alloy.Collections.instance("taxa").loadCurrent();
			},

			loadUploadQueue: function() {
				this.fetch( { query: "SELECT * FROM sample WHERE (dateCompleted IS NOT NULL) AND (uploaded IS NULL) ORDER BY dateCompleted DESC"});
			}
		});

		return Collection;
	}
};
