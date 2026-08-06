// Resolves a training session code to its expected ordered taxonIds. The
// exercise data (a { "<code>": [orderedTaxonId…] } map) is injected so this
// stays Node-testable; the runtime reads the bundled assets/training-exercises.json
// and passes it in.
module.exports = function createTrainingExercises(exercises) {
  return {
    loadExercise(code) {
      const order = exercises[String(code)];
      return order ? order : null;
    },
  };
};
