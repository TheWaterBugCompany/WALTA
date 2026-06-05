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

		describe("parentForDepth", function () {
			it("returns this when this is already shallower than the target depth", function () {
				const c = new Choice(1, "c", null, null);
				expect(c.parentForDepth(2)).to.equal(c);
			});

			it("walks up the .parent chain until depth is strictly shallower", function () {
				const a = new Choice(1, "a", null, null);
				const b = new Choice(2, "b", null, null);
				const c = new Choice(3, "c", null, null);
				b.parent = a;
				c.parent = b;
				// from c, looking for parent of a new depth-2 sibling: skip c and b, land on a
				expect(c.parentForDepth(2)).to.equal(a);
				// from c, looking for parent of a new depth-3 sibling: skip c, land on b
				expect(c.parentForDepth(3)).to.equal(b);
				// from c, looking for parent of a new depth-1 root: walk past everything
				expect(c.parentForDepth(1)).to.equal(null);
			});
		});
	});

	describe("Knot.choices() tree", function () {
		it("returns top-level choices as a flat list when they're all at the same depth", function () {
			const knot = new Knot("k");
			const a = new Choice(1, "a", null, null);
			const b = new Choice(1, "b", null, null);
			knot.add(a);
			knot.add(b);
			expect(knot.choices()).to.have.length(2);
			expect(knot.choices()[0]).to.equal(a);
			expect(knot.choices()[1]).to.equal(b);
			expect(a.children).to.have.length(0);
			expect(a.parent).to.equal(null);
		});

		it("nests a deeper choice under the preceding shallower one", function () {
			const knot = new Knot("k");
			const p = new Choice(1, "p", null, null);
			const c = new Choice(2, "c", null, null);
			knot.add(p);
			knot.add(c);
			expect(knot.choices()).to.have.length(1);
			expect(knot.choices()[0]).to.equal(p);
			expect(p.children).to.have.length(1);
			expect(p.children[0]).to.equal(c);
			expect(c.parent).to.equal(p);
		});

		it("walks up multiple levels when depth drops back to the root", function () {
			// * a
			// ** b
			// *** c
			// ** d  ← walk up one: parent = a
			// * e   ← walk up two: parent = null (root)
			const knot = new Knot("k");
			const a = new Choice(1, "a", null, null);
			const b = new Choice(2, "b", null, null);
			const c = new Choice(3, "c", null, null);
			const d = new Choice(2, "d", null, null);
			const e = new Choice(1, "e", null, null);
			[a, b, c, d, e].forEach(ch => knot.add(ch));

			expect(knot.choices()).to.have.length(2);
			expect(knot.choices()[0]).to.equal(a);
			expect(knot.choices()[1]).to.equal(e);

			expect(a.children.map(x => x.text)).to.deep.equal(["b", "d"]);
			expect(b.children.map(x => x.text)).to.deep.equal(["c"]);
			expect(d.children).to.have.length(0);
			expect(e.children).to.have.length(0);

			expect(a.parent).to.equal(null);
			expect(b.parent).to.equal(a);
			expect(c.parent).to.equal(b);
			expect(d.parent).to.equal(a);
			expect(e.parent).to.equal(null);
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
