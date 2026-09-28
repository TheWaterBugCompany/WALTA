// Whether two taxonIds name the same taxon. The id is CERDI's integer
// creature_id, but it reaches the app spelled both ways: the key indexes its
// taxa in an object, so it hands out "198", while an exercise and the training
// table hold 198. Comparing them strictly calls a right answer wrong.
module.exports = function sameTaxon(a, b) {
  return String(a) === String(b);
};
