require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const os = require("os");
const path = require("path");

const KeyLoaderInk = require("logic/KeyLoaderInk");

describe("KeyLoaderInk", function () {
	let dir;

	beforeEach(function () {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "ink-spec-"));
	});

	function writeKey(text, includes = {}) {
		fs.writeFileSync(path.join(dir, "key.ink"), text);
		Object.entries(includes).forEach(([name, body]) => {
			fs.writeFileSync(path.join(dir, name), body);
		});
		return KeyLoaderInk.loadKey(dir + "/");
	}

	describe("knots, choices, diverts", function () {
		it("treats loose top-level choices as the entry-point menu", function () {
			const key = writeKey(`
* ALT Key -> root
* Speedbug -> sb
=== root ===
* Animal -> animal_node
=== animal_node ===
-> DONE
=== sb ===
-> DONE
`);
			// After load, the "ALT Key" outcome becomes the new root.
			expect(key.root.id).to.equal("root");
			expect(key.root.questions[0].text).to.equal("Animal");
			expect(key.root.questions[0].outcome.id).to.equal("animal_node");
		});

		it("resolves diverts between knots", function () {
			const key = writeKey(`
* ALT Key -> a
=== a ===
* x -> b
=== b ===
* y -> c
=== c ===
-> DONE
`);
			expect(key.findNode("a").questions[0].outcome.id).to.equal("b");
			expect(key.findNode("b").questions[0].outcome.id).to.equal("c");
		});

		it("treats deeper * depth as nested choices under the shallower one", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* parent
** child1 -> dest1
** child2 -> dest2
=== dest1 ===
-> DONE
=== dest2 ===
-> DONE
`);
			const parent = key.root.questions[0];
			expect(parent.text).to.equal("parent");
			const sub = parent.outcome;
			expect(sub.questions.map(q => q.text)).to.deep.equal(["child1", "child2"]);
			expect(sub.questions[0].outcome.id).to.equal("dest1");
		});

		it("handles a choice that diverts directly to DONE without crashing", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* dead end -> DONE
`);
			expect(key.root.questions[0].text).to.equal("dead end");
			expect(key.root.questions[0].outcome).to.satisfy(o => o == null);
		});
	});

	describe("tags on choices — both syntactic forms", function () {
		it("accepts tag BEFORE divert: * text # tag -> dest", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* see this # mediaUrls: ["/img/a.png"] -> dest
=== dest ===
-> DONE
`);
			expect(key.root.questions[0].mediaUrls).to.deep.equal(["/img/a.png"]);
		});

		it("accepts tag AFTER divert: * text -> dest # tag", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* see this -> dest # mediaUrls: ["/img/b.png"]
=== dest ===
-> DONE
`);
			expect(key.root.questions[0].mediaUrls).to.deep.equal(["/img/b.png"]);
		});

		it("produces the same question.mediaUrls for both forms", function () {
			const before = writeKey(`
* ALT Key -> root
=== root ===
* x # mediaUrls: ["/p.png"] -> d
=== d ===
-> DONE
`);
			// fresh tmpdir so the second load doesn't collide
			dir = fs.mkdtempSync(path.join(os.tmpdir(), "ink-spec-"));
			const after = writeKey(`
* ALT Key -> root
=== root ===
* x -> d # mediaUrls: ["/p.png"]
=== d ===
-> DONE
`);
			expect(after.root.questions[0].mediaUrls)
				.to.deep.equal(before.root.questions[0].mediaUrls);
		});

		it("wraps a non-array mediaUrls value into an array", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* x # mediaUrls: "/single.png" -> d
=== d ===
-> DONE
`);
			expect(key.root.questions[0].mediaUrls).to.deep.equal(["/single.png"]);
		});
	});

	describe("taxon knots (standalone-line tags)", function () {
		it("turns a knot with # taxonId: into a Taxon", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* see frog -> frog
=== frog ===
# taxonId: "42"
# name: "Frog"
# size: 10
-> DONE
`);
			const frog = key.findTaxonById("42");
			expect(frog).to.exist;
			expect(frog.name).to.equal("Frog");
			expect(frog.size).to.equal(10);
		});

		it("attaches the taxon as the outcome of its referencing question", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* see frog -> frog
=== frog ===
# taxonId: "42"
-> DONE
`);
			expect(key.root.questions[0].outcome.taxonId).to.equal("42");
		});

		it("parses JSON-shaped tag values (arrays, objects, numbers)", function () {
			const key = writeKey(`
* ALT Key -> root
=== root ===
* see -> t
=== t ===
# taxonId: "1"
# scientificName: [{"taxonomicLevel":"class","name":"Insecta"}]
# mediaUrls: ["/a.jpg","/b.jpg"]
# signalScore: 7
-> DONE
`);
			const t = key.findTaxonById("1");
			expect(t.scientificName).to.deep.equal([{ taxonomicLevel: "class", name: "Insecta" }]);
			expect(t.mediaUrls).to.deep.equal(["/a.jpg", "/b.jpg"]);
			expect(t.signalScore).to.equal(7);
		});
	});

	describe("INCLUDE", function () {
		it("resolves an INCLUDE'd file's knots into the same namespace", function () {
			const key = writeKey(
				`* ALT Key -> root
INCLUDE taxa.ink
=== root ===
* see -> wallaby
`,
				{
					"taxa.ink": `=== wallaby ===
# taxonId: "99"
# name: "Wallaby"
-> DONE
`
				}
			);
			expect(key.findTaxonById("99").name).to.equal("Wallaby");
		});

		it("keeps loose content in the parent file under the synthetic root, even when INCLUDE comes first", function () {
			// Regression test for the parent-file-first ordering: INCLUDE at the
			// top of key.ink must not shadow the parent's own root-level menu.
			const key = writeKey(
				`INCLUDE taxa.ink
* ALT Key -> root
* Speedbug -> sb
=== root ===
* see -> wallaby
=== sb ===
-> DONE
`,
				{
					"taxa.ink": `=== wallaby ===
# taxonId: "99"
-> DONE
`
				}
			);
			expect(key.root.id).to.equal("root");
			expect(key.root.questions[0].outcome.taxonId).to.equal("99");
		});
	});

	describe("comments", function () {
		it("strips // line comments", function () {
			const key = writeKey(`
// header comment
* ALT Key -> root  // trailing
=== root ===     // knot-line comment
* x -> d
=== d ===
-> DONE
`);
			expect(key.root.questions[0].text).to.equal("x");
		});

		it("strips /* inline */ and /* multi-line */ comments", function () {
			const key = writeKey(`
/* a leading
   multi-line
   block */
* ALT Key -> root
=== root ===
* x /* mid-line */ -> d
=== d ===
-> DONE
`);
			expect(key.root.questions[0].text).to.equal("x");
		});
	});

	describe("speedbug index", function () {
		it("builds an index keyed by the 'Not sure' divert target id", function () {
			const key = writeKey(`
* ALT Key -> root
* Speedbug -> sb
=== root ===
-> DONE
=== sb ===
* Group 1
** Not sure -> grp_a
** Tile1 # mediaUrls: "/s/t1.png" -> t1
=== grp_a ===
-> DONE
=== t1 ===
# taxonId: "100"
-> DONE
`);
			const sbi = key.getSpeedbugIndex("Speedbug");
			expect(sbi).to.exist;
			const index = sbi.getSpeedbugIndex();
			expect(index.grp_a).to.exist;
			expect(index.grp_a.bugs).to.have.length(1);
			expect(index.grp_a.bugs[0].imgUrl).to.equal("/s/t1.png");
			expect(index.grp_a.bugs[0].refId).to.equal("t1");
		});
	});

	describe("real WALTA key (regression)", function () {
		it("loads ./walta-taxonomy/walta/ and exposes Helicopsyche with the corrected silhouette", function () {
			const key = KeyLoaderInk.loadKey("./walta-taxonomy/walta/");
			const helicopsyche = key.findTaxonById("158");
			expect(helicopsyche).to.exist;
			expect(helicopsyche.name).to.equal("Helicopsyche");
			expect(helicopsyche.bluebug).to.deep.equal([
				"/taxonomy/walta/media/speedbug/flat_snail_b.png"
			]);
		});

		it("registers all three speedbug indexes", function () {
			const key = KeyLoaderInk.loadKey("./walta-taxonomy/walta/");
			["Speedbug", "Mayfly Muster Speedbug", "Order Speedbug"].forEach(name => {
				expect(key.getSpeedbugIndex(name), `missing index: ${name}`).to.exist;
			});
		});

		it("links every mediaUrls/bluebug path to a file that exists on disk", function () {
			const key = KeyLoaderInk.loadKey("./walta-taxonomy/walta/");
			const refs = [].concat(
				key.findAllMedia("mediaUrls", false),
				key.findAllMedia("bluebug")
			);
			const missing = refs.filter(({ url }) =>
				url && !fs.existsSync(url.replace("/taxonomy/", "walta-taxonomy/"))
			);
			expect(missing.map(r => r.url)).to.deep.equal([]);
		});
	});
});
