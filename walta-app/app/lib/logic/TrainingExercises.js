// Resolves a training session code to its expected ordered taxonIds and to the
// belt level completing it earns. The exercise data (a
// { "<code>": { beltLevel, taxa: [orderedTaxonId…] } } map) is injected so this
// stays Node-testable; the runtime reads the bundled
// assets/training-exercises.json and passes it in.
module.exports = function createTrainingExercises(exercises) {
  function find(code) {
    return exercises[String(code)] || null;
  }

  return {
    loadExercise(code) {
      const exercise = find(code);
      return exercise ? exercise.taxa : null;
    },

    beltLevelFor(code) {
      const exercise = find(code);
      return exercise ? exercise.beltLevel : null;
    },
  };
};
