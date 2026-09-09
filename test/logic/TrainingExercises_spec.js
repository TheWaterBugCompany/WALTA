require("mocha");
const { expect } = require("chai");
const createTrainingExercises = require("logic/TrainingExercises");

// The Academy enters a 3-digit code; the loader resolves it to the exercise's
// expected ordered taxonIds (or null when the code is unknown) and to the belt
// level completing it earns.
describe("logic/TrainingExercises", function () {
  const exercises = {
    "042": { beltLevel: 1, taxa: [1, 2, 3] },
    "108": { beltLevel: 4, taxa: [7, 4] },
  };

  it("resolves a known code to its ordered taxonIds", function () {
    expect(createTrainingExercises(exercises).loadExercise("042")).to.deep.equal([1, 2, 3]);
  });

  it("returns null for an unknown code", function () {
    expect(createTrainingExercises(exercises).loadExercise("999")).to.equal(null);
  });

  it("accepts a numeric code, matching the string key", function () {
    expect(createTrainingExercises(exercises).loadExercise(108)).to.deep.equal([7, 4]);
  });

  it("resolves the belt level completing an exercise earns", function () {
    expect(createTrainingExercises(exercises).beltLevelFor("108")).to.equal(4);
  });

  it("has no belt level for an unknown code", function () {
    expect(createTrainingExercises(exercises).beltLevelFor("999")).to.equal(null);
  });
});
