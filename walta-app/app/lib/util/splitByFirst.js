// Split `str` at the first occurrence of `sep`, returning the trimmed
// prefix and suffix as [first, rest]. Returns null only when the
// separator is absent — callers that treat an empty prefix as malformed
// (e.g. an HTTP header with no name) check `first` themselves.
function splitByFirst( str, sep ) {
	const idx = str.indexOf( sep );
	if ( idx === -1 ) return null;
	return [
		str.slice( 0, idx ).trim(),
		str.slice( idx + sep.length ).trim(),
	];
}

module.exports = splitByFirst;
