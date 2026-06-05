require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { Tag, Divert, Choice, Knot, InkDocument } = require("logic/InkDocument");

describe("InkDocument (Ink parser)", function () {
	let dir;

	beforeEach(function () {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "ink-spec-"));
	});

	describe("Tag", function () {
		it("parses a standalone-line tag into name + JSON-coerced value", function () {
			const tag = Tag.parse("# size: 10");
			expect(tag.name).to.equal("size");
			expect(tag.parsedValue()).to.equal(10);
		});
	});

	describe("Divert", function () {
		it("recognises DONE as a terminator", function () {
			expect(Divert.parse("-> DONE").isTerminator()).to.equal(true);
		});
	});

	describe("Choice", function () {
		it("parses post-divert tag form into text + tag + divert.target", function () {
			const c = Choice.parse('* X -> dest # mediaUrls: "/p.png"');
			expect(c.text).to.equal("X");
			expect(c.tag.name).to.equal("mediaUrls");
			expect(c.divert.target).to.equal("dest");
		});
	});

	describe("InkDocument", function () {
		it("resolves an INCLUDE'd knot via doc.knot()", function () {
			fs.writeFileSync(path.join(dir, "key.ink"), "INCLUDE foo.ink\n");
			fs.writeFileSync(path.join(dir, "foo.ink"), `=== foo ===\n# taxonId: "42"\n-> DONE\n`);
			const doc = new InkDocument(path.join(dir, "key.ink"));
			expect(doc.knot("foo")).to.be.instanceOf(Knot);
		});
	});
});
