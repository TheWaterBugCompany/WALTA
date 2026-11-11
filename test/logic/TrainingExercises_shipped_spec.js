require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

const KeyLoaderJson = require("logic/KeyLoaderJson");
const createTrainingExercises = require("logic/TrainingExercises");
const Belts = require("logic/Belts");

// The courses as they actually ship, read against the key they are graded with.
// A course is a list of taxonIds typed out by hand from a creature list, and
// nothing at runtime tells anyone an id was mistyped — it simply becomes a cell
// the trainee can never get right.

const KEY_DIR = path.resolve(__dirname, "../../walta-taxonomy/walta") + "/";
const EXERCISES = path.resolve(__dirname, "../../walta-app/app/assets/training-exercises.json");

// The Academy derives the code from the belt the trainee is going for, so a
// course is reachable only under the code that matches the belt it awards.
const FIRST_COURSE = 100;

describe("the shipped training courses", function () {
	let key, exercises, shipped;

	before(function () {
		key = KeyLoaderJson.loadKey(KEY_DIR);
		shipped = JSON.parse(fs.readFileSync(EXERCISES, "utf8"));
		exercises = createTrainingExercises(shipped);
	});

	function namesOf(code) {
		return exercises.loadExercise(code).map((id) => {
			const taxon = key.findTaxonById(String(id));
			return taxon ? taxon.name : `no taxon with id ${id}`;
		});
	}

	// The creature list the course author wrote, in the order the video teaches
	// it — the assessor grades by position, so the order is part of the course.
	it("walks the Yellow Belt course through its six creatures in order", function () {
		expect(namesOf("102")).to.deep.equal([
			"Eustheniidae",
			"Gripops or Fluffy bums",
			"Leptophlebs",
			"Atalophlebia",
			"Hydrobiosidae",
			"Amphipoda",
		]);
	});

	it("awards the yellow belt for the Yellow Belt course", function () {
		expect(Belts.nameOf(Belts.at(exercises.beltLevelFor("102")))).to.equal("yellow");
	});

	it("names a real taxon in every cell of every course", function () {
		Object.keys(shipped).forEach(function (code) {
			namesOf(code).forEach(function (name, i) {
				expect(name, `course ${code} cell ${i + 1}`).to.not.match(/^no taxon with id /);
			});
		});
	});

	it("files every course under the code that earns its belt", function () {
		Object.keys(shipped).forEach(function (code) {
			expect(Number(code), `course ${code}`).to.equal(FIRST_COURSE + exercises.beltLevelFor(code));
		});
	});
});
