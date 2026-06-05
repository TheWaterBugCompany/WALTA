require("mocha");
const { expect } = require("chai");
const splitByFirst = require("../../walta-app/app/lib/util/splitByFirst");

describe("splitByFirst", function () {
	it("trims and splits at the first occurrence of the separator only", function () {
		expect(splitByFirst(" name : value : extra ", ":"))
			.to.deep.equal(["name", "value : extra"]);
	});

	it("returns null when the separator is absent", function () {
		expect(splitByFirst("no separator here", ":")).to.equal(null);
	});

	it("returns an empty first when the separator is at the start", function () {
		expect(splitByFirst(": value", ":")).to.deep.equal(["", "value"]);
	});
});
