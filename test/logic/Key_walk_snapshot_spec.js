require("mocha");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

const KeyLoaderJson = require("logic/KeyLoaderJson");

// Snapshot test that walks the runtime Key — every reachable question,
// taxon, divert, and speedbug entry — and compares the canonical log
// against a checked-in fixture. Tree-shape regressions (an outcome
// pointing to the wrong taxon, a speedbug group losing an entry, a
// taxon attribute changing) fail the test with the offending line.
//
// To accept an intentional change to the key:
//   UPDATE_SNAPSHOT=1 npx grunt unit-test-node
// Review the resulting diff in the snapshot file before committing.

const KEY_DIR = path.resolve(__dirname, "../../walta-taxonomy/walta") + "/";
const SNAPSHOT = path.resolve(__dirname, "fixtures/key_walk_snapshot.txt");

function fmt(v) {
	if (v === undefined) return "undef";
	if (v === null) return "null";
	if (Array.isArray(v)) return "[" + v.map(fmt).join(",") + "]";
	if (typeof v === "object") return JSON.stringify(v);
	return JSON.stringify(v);
}

// Every persisted Taxon attribute. Pinning all of them in the snapshot
// means a parser regression that drops or corrupts (say) commonName or
// habitat for some taxon fails this test, even though it'd otherwise
// only surface in the taxon detail screen's asDetailHtml output.
// parentLink/taxonParent are deliberately excluded — they're object
// references the walker already follows via the tree traversal, and
// fmt'ing them as JSON would either cycle or dump a sibling sub-tree.
const TAXON_ATTRS = [
	"taxonId", "ref", "name", "scientificName", "commonName",
	"size", "signalScore", "habitat", "movement", "confusedWith",
	"taxonomicLevel", "description", "mediaUrls", "bluebug"
];
function taxonAttrs(t) {
	return TAXON_ATTRS.map(k => `${k}=${fmt(t[k])}`).join(" ");
}

function walkKey(key) {
	const lines = [];
	const visited = new Set();

	function walk(node, trail) {
		if (!node) {
			lines.push(`${trail} -> NULL`);
			return;
		}
		if (visited.has(node)) {
			lines.push(`${trail} -> (visited ${key.isTaxon(node) ? "TAXON:" + node.taxonId : "NODE:" + (node.id || "anon")})`);
			return;
		}
		visited.add(node);

		if (key.isTaxon(node)) {
			lines.push(`${trail} TAXON id=${fmt(node.id)} ${taxonAttrs(node)}`);
			return;
		}

		lines.push(`${trail} NODE id=${fmt(node.id)} questions=${node.questions.length}`);
		node.questions.forEach((q, i) => {
			lines.push(`${trail}/${i} Q text=${fmt(q.text)} mediaUrls=${fmt(q.mediaUrls)}`);
			walk(q.outcome, `${trail}/${i}`);
		});
	}

	lines.push("=== KEY ROOT ===");
	walk(key.getRootNode(), "");

	lines.push("");
	lines.push("=== SPEEDBUG INDEXES ===");
	["Speedbug", "Mayfly Muster Speedbug", "Order Speedbug"].forEach(name => {
		const sbi = key.getSpeedbugIndex(name);
		if (!sbi) { lines.push(`${name}: MISSING`); return; }
		const idx = sbi.getSpeedbugIndex();
		const groupKeys = Object.keys(idx).sort();
		lines.push(`${name}: ${groupKeys.length} group(s)`);
		groupKeys.forEach(g => {
			const grp = idx[g];
			lines.push(`  group ${g} refId=${fmt(grp.refId)} bugs=${grp.bugs.length}`);
			const sortedBugs = grp.bugs.slice().sort((a, b) =>
				(a.refId || "").localeCompare(b.refId || "")
			);
			sortedBugs.forEach(b => {
				lines.push(`    bug refId=${fmt(b.refId)} imgUrl=${fmt(b.imgUrl)}`);
			});
		});
	});

	lines.push("");
	lines.push("=== ALL TAXA (sorted by taxonId) ===");
	const taxa = key.findAllTaxons().slice().sort((a, b) => {
		const an = parseInt(a.taxonId, 10), bn = parseInt(b.taxonId, 10);
		return isNaN(an - bn) ? String(a.taxonId).localeCompare(String(b.taxonId)) : an - bn;
	});
	taxa.forEach(t => {
		lines.push(`taxon ${fmt(t.taxonId)} id=${fmt(t.id)} ${taxonAttrs(t)}`);
	});

	lines.push("");
	lines.push("=== SILHOUETTE LOOKUPS (taxon × index) ===");
	const sbiNames = ["Speedbug", "Mayfly Muster Speedbug", "Order Speedbug"];
	taxa.forEach(t => {
		sbiNames.forEach(name => {
			const url = key.getSpeedbugIndex(name).getSpeedbugFromTaxonId(t.taxonId);
			lines.push(`getSpeedbugFromTaxonId(${fmt(t.taxonId)}, ${fmt(name)}) = ${fmt(url)}`);
		});
	});

	return lines.join("\n") + "\n";
}

describe("Key walk snapshot (runtime behaviour regression)", function () {
	it("matches the committed snapshot for walta-taxonomy/walta/key.json", function () {
		const key = KeyLoaderJson.loadKey(KEY_DIR);
		const actual = walkKey(key);

		if (process.env.UPDATE_SNAPSHOT === "1") {
			fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
			fs.writeFileSync(SNAPSHOT, actual);
			console.log(`\n  ⓘ snapshot updated: ${SNAPSHOT}`);
			return;
		}

		if (!fs.existsSync(SNAPSHOT)) {
			throw new Error(
				`Snapshot missing at ${SNAPSHOT}. Generate it once with:\n` +
				`  UPDATE_SNAPSHOT=1 npx grunt unit-test-node`
			);
		}

		const expected = fs.readFileSync(SNAPSHOT, "utf-8");
		if (actual === expected) return;

		// Write the actual to <snapshot>.actual so the dev can diff it.
		const actualPath = SNAPSHOT + ".actual";
		fs.writeFileSync(actualPath, actual);

		// Find the first divergent line for a useful failure message.
		const aLines = actual.split("\n");
		const eLines = expected.split("\n");
		let firstDiff = -1;
		for (let i = 0; i < Math.max(aLines.length, eLines.length); i++) {
			if (aLines[i] !== eLines[i]) { firstDiff = i; break; }
		}
		expect.fail(
			`Key walk differs from snapshot at line ${firstDiff + 1}:\n` +
			`  expected: ${eLines[firstDiff]}\n` +
			`  actual:   ${aLines[firstDiff]}\n` +
			`Full actual written to ${actualPath}.\n` +
			`Diff with: diff ${SNAPSHOT} ${actualPath}\n` +
			`If the change is intentional: UPDATE_SNAPSHOT=1 npx grunt unit-test-node`
		);
	});
});
