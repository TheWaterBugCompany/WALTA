#! /usr/bin/node
//
// Draws the compiled key as an SVG dendrogram, highlighting the nodes that can
// be reached by more than one route.
//
// The key is a DAG, not a tree, but every node records a single `parentLink` —
// so any code that reconstructs a path by walking parents (the "which question
// did I get wrong" hint) rebuilds one particular route, which may not be the
// route the user took. The diagram exists to make those convergence points, and
// the route each one keeps, visible to a reader of the taxonomy.
//
//   ./run_diagram_key [key.json] [out.svg]

const fs = require("fs");

const INPUT = process.argv[2] || "walta/key.json";
const OUTPUT = process.argv[3] || "walta/key-graph.svg";

const COLUMN_WIDTH = 132;
const ROW_HEIGHT = 15.5;
const PAD_LEFT = 70;
const PAD_TOP = 150;
const FOOTER_HEIGHT = 272;

// key.json is circular-json: a repeated node is written once and referred to
// afterwards by a "~root~questions~1~outcome" path string.
function resolveBackReferences(doc) {
	const at = (path) =>
		path
			.split("~")
			.filter(Boolean)
			.reduce((cur, step) => cur[/^\d+$/.test(step) ? Number(step) : step], doc);
	const deref = (value) => (typeof value === "string" ? at(value) : value);

	(function resolve(node, seen = new Set()) {
		if (!node || !node.questions || seen.has(node)) return;
		seen.add(node);
		node.questions.forEach((question) => {
			question.outcome = deref(question.outcome);
			resolve(question.outcome, seen);
		});
	})(doc.root);

	return deref;
}

function buildGraph(root, deref) {
	const byObject = new Map();
	const vertexFor = (obj) => {
		if (!byObject.has(obj)) {
			byObject.set(obj, {
				obj,
				id: obj.id,
				taxonId: obj.taxonId,
				isTaxon: !obj.questions,
				label: obj.questions ? obj.id : obj.commonName || obj.name || obj.id,
				parents: [],
				children: [],
			});
		}
		return byObject.get(obj);
	};

	(function link(node, seen = new Set()) {
		if (seen.has(node)) return;
		seen.add(node);
		const vertex = vertexFor(node);
		if (!node.questions) return;
		node.questions.forEach((question) => {
			const child = vertexFor(question.outcome);
			vertex.children.push({ text: question.text, vertex: child });
			child.parents.push({ text: question.text, vertex });
			link(question.outcome, seen);
		});
	})(root);

	const vertices = [...byObject.values()];
	vertices.forEach((v) => {
		const parent = deref(v.obj.parentLink);
		v.canonicalParent = parent ? byObject.get(parent) : null;
	});
	// The tree the diagram lays out is the one parentLink describes; every other
	// incoming edge is drawn over the top of it as a convergence edge.
	vertices.forEach((v) => {
		v.treeChildren = v.children.filter((c) => c.vertex.canonicalParent === v);
	});

	const convergenceEdges = vertices.flatMap((v) =>
		v.children
			.filter((c) => c.vertex.canonicalParent !== v)
			.map((c) => ({ from: v, to: c.vertex, text: c.text }))
	);

	return { vertices, root: vertexFor(root), convergenceEdges };
}

function layout(root) {
	let nextRow = 0;
	(function place(vertex, depth) {
		vertex.depth = depth;
		if (vertex.treeChildren.length === 0) {
			vertex.row = nextRow;
			nextRow += ROW_HEIGHT;
		} else {
			vertex.treeChildren.forEach((c) => place(c.vertex, depth + 1));
			const kids = vertex.treeChildren;
			vertex.row = (kids[0].vertex.row + kids[kids.length - 1].vertex.row) / 2;
		}
		vertex.x = PAD_LEFT + depth * COLUMN_WIDTH;
		vertex.y = PAD_TOP + vertex.row;
	})(root, 0);
	return nextRow;
}

const escapeXml = (s) =>
	String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function curve(x1, y1, x2, y2) {
	const mid = (x1 + x2) / 2;
	return `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
}

// Joins two nodes in different columns: bows out of each and crosses the tree.
function arc(x1, y1, x2, y2, bow) {
	return `M${x1},${y1} C${x1 + bow},${y1} ${x2 - bow},${y2} ${x2},${y2}`;
}

// Joins two nodes in much the same column, where an arc would fold back on
// itself — loops out to one side instead.
function loop(x1, y1, x2, y2, bow) {
	return `M${x1},${y1} C${x1 + bow},${y1} ${x2 + bow},${y2} ${x2},${y2}`;
}

function pathFromRoot(vertex) {
	const ids = [];
	for (let cur = vertex; cur; cur = cur.canonicalParent) ids.unshift(cur.id);
	return ids;
}

function renderHeader(width, graph, maxDepth) {
	const couplets = graph.vertices.filter((v) => !v.isTaxon).length;
	const taxa = graph.vertices.length - couplets;
	const legendX = width - 560;
	return `<rect width="100%" height="100%" fill="#fbfbf9"/>
<text x="${PAD_LEFT}" y="46" font-size="30" font-weight="700" fill="#1c1917">WALTA dichotomous key — structure and convergence points</text>
<text x="${PAD_LEFT}" y="74" font-size="15" fill="#57534e">${graph.vertices.length} nodes (${couplets} couplets, ${taxa} taxa) · max depth ${maxDepth} · generated from key.json</text>
<text x="${PAD_LEFT}" y="99" font-size="15" fill="#9a3412" font-weight="600">No cycles. But ${graph.convergenceEdges.length} extra edges make this a DAG: ${new Set(graph.convergenceEdges.map((e) => e.to)).size} nodes are reachable by more than one route.</text>
<text x="${PAD_LEFT}" y="121" font-size="14" fill="#57534e">Grey = the single route <tspan font-family="monospace" font-size="13">parentLink</tspan> records. Orange = a second route into the same node, invisible to <tspan font-family="monospace" font-size="13">pathFromRoot()</tspan>.</text>
<g transform="translate(${legendX},30)">
<rect x="-14" y="-14" width="500" height="104" rx="8" fill="#fff" stroke="#e7e5e4"/>
<line x1="0" y1="4" x2="30" y2="4" stroke="#a8a29e" stroke-width="1.6"/><text x="40" y="8" font-size="13" fill="#44403c">canonical edge (the one parentLink walks back up)</text>
<line x1="0" y1="30" x2="30" y2="30" stroke="#c2410c" stroke-width="2.4"/><text x="40" y="34" font-size="13" fill="#44403c">convergence edge — a second way into the same node</text>
<circle cx="15" cy="56" r="5" fill="#c2410c"/><text x="40" y="60" font-size="13" fill="#44403c">node with more than one parent</text>
<rect x="10" y="74" width="10" height="10" fill="#7c3aed"/><text x="40" y="84" font-size="13" fill="#44403c">one taxonId at two key positions</text></g>`;
}

function renderFooter(width, top, converged) {
	const rows = [...converged].sort((a, b) => a.y - b.y);
	const out = [
		`<g transform="translate(${PAD_LEFT},${top})">`,
		`<rect x="-16" y="-30" width="${width - PAD_LEFT * 2 + 32}" height="262" rx="10" fill="#fff" stroke="#e7e5e4"/>`,
		`<text x="0" y="-6" font-size="17" font-weight="700" fill="#1c1917">Convergence points — where a node has more than one way in</text>`,
		`<text x="0" y="16" font-size="13" fill="#57534e">pathFromRoot() follows <tspan font-family="monospace">parentLink</tspan>, which stores exactly one parent. Reach one of these nodes by any other route and the reconstructed path is the KEPT one, not the one the user walked.</text>`,
		`<text x="0" y="46" font-size="11.5" font-weight="700" fill="#78716c">NODE</text><text x="210" y="46" font-size="11.5" font-weight="700" fill="#78716c">KEPT BY parentLink</text><text x="470" y="46" font-size="11.5" font-weight="700" fill="#78716c">OTHER WAY(S) IN — LOST</text><text x="900" y="46" font-size="11.5" font-weight="700" fill="#78716c">PATH parentLink REBUILDS</text>`,
	];
	rows.forEach((v, i) => {
		const y = 68 + i * 23;
		const lost = v.parents
			.filter((p) => p.vertex !== v.canonicalParent)
			.map((p) => p.vertex.id)
			.join(", ");
		if (i % 2 === 0)
			out.push(`<rect x="-8" y="${y - 14}" width="${width - PAD_LEFT * 2 + 16}" height="21" fill="#faf8f5"/>`);
		out.push(
			`<text x="0" y="${y}" font-size="12" font-weight="600" fill="#9a3412">${escapeXml(v.id)}${v.taxonId ? ` <tspan font-weight="400" fill="#a8a29e">#${v.taxonId}</tspan>` : ""}</text>`,
			`<text x="210" y="${y}" font-size="12" fill="#166534">${escapeXml(v.canonicalParent.id)}</text>`,
			`<text x="470" y="${y}" font-size="12" fill="#b91c1c">${escapeXml(lost)}</text>`,
			`<text x="900" y="${y}" font-size="11" font-family="monospace" fill="#57534e">${escapeXml(pathFromRoot(v).join(" > "))}</text>`
		);
	});
	out.push("</g>");
	return out.join("\n");
}

function render(graph) {
	const maxDepth = Math.max(...graph.vertices.map((v) => v.depth));
	const treeHeight = Math.max(...graph.vertices.map((v) => v.y)) + 90;
	const width = (maxDepth + 1) * COLUMN_WIDTH + 300;
	const height = treeHeight + FOOTER_HEIGHT;
	const converged = new Set(graph.convergenceEdges.map((e) => e.to));

	const out = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif">`,
		`<defs>
<marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#c2410c"/></marker>
<marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#7c3aed"/></marker>
</defs>`,
		renderHeader(width, graph, maxDepth),
	];

	graph.vertices.forEach((v) =>
		v.treeChildren.forEach((c) =>
			out.push(
				`<path d="${curve(v.x + 6, v.y, c.vertex.x - 4, c.vertex.y)}" fill="none" stroke="#b7b3ae" stroke-width="1.1"><title>${escapeXml(c.text)}</title></path>`
			)
		)
	);

	graph.convergenceEdges.forEach((e) => {
		const bow = Math.max(90, Math.abs(e.to.y - e.from.y) * 0.32);
		out.push(
			`<path d="${arc(e.from.x + 6, e.from.y, e.to.x - 6, e.to.y, bow)}" fill="none" stroke="#c2410c" stroke-width="2.1" stroke-opacity="0.8" marker-end="url(#ar)"><title>${escapeXml(e.from.id)} → ${escapeXml(e.to.id)}\n${escapeXml(e.text)}</title></path>`
		);
	});

	// A taxonId indexes one node in taxIdToNode, so a taxonId at two key
	// positions means findTaxonById() can only ever return one of them.
	const byTaxonId = {};
	graph.vertices
		.filter((v) => v.isTaxon && v.taxonId)
		.forEach((v) => (byTaxonId[v.taxonId] = (byTaxonId[v.taxonId] || []).concat(v)));
	Object.entries(byTaxonId)
		.filter(([, group]) => group.length > 1)
		.forEach(([taxonId, [a, b]]) => {
			const bow = Math.abs(b.y - a.y) * 0.3 + 170;
			out.push(
				`<path d="${loop(a.x, a.y, b.x, b.y, bow)}" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ar2)"><title>${escapeXml(a.id)} and ${escapeXml(b.id)} share taxonId ${taxonId} — findTaxonById() returns only one</title></path>`
			);
		});

	graph.vertices.forEach((v) => {
		const converges = converged.has(v);
		const fill = converges ? "#c2410c" : v.isTaxon ? "#0f766e" : "#78716c";
		out.push(`<g><circle cx="${v.x}" cy="${v.y}" r="${converges ? 5.5 : v.isTaxon ? 3.4 : 3}" fill="${fill}"/>`);
		if (converges) {
			out.push(
				`<circle cx="${v.x}" cy="${v.y}" r="10" fill="none" stroke="#c2410c" stroke-width="1.4" stroke-opacity="0.45"/>`,
				`<text x="${v.x}" y="${v.y - 15}" font-size="12" font-weight="700" text-anchor="middle" fill="#9a3412" paint-order="stroke" stroke="#fbfbf9" stroke-width="4">${escapeXml(v.label)}${v.taxonId ? ` #${v.taxonId}` : ""} <tspan fill="#c2410c">(${v.parents.length} ways in)</tspan></text>`
			);
		} else if (v.isTaxon || v.treeChildren.length === 0 || v.depth <= 3) {
			const branching = v.treeChildren.length > 0;
			out.push(
				`<text x="${v.x + (branching ? -9 : 8)}" y="${v.y + 3.6}" font-size="10" text-anchor="${branching ? "end" : "start"}" fill="${v.isTaxon ? "#115e59" : "#57534e"}" paint-order="stroke" stroke="#fbfbf9" stroke-width="2.6">${escapeXml(v.label)}${v.taxonId ? ` <tspan fill="#a8a29e">#${v.taxonId}</tspan>` : ""}</text>`
			);
		}
		const parentList = v.parents.length > 1 ? "\nPARENTS: " + v.parents.map((p) => p.vertex.id).join(", ") : "";
		out.push(`<title>${escapeXml(v.id)}${v.taxonId ? " · taxonId " + v.taxonId : ""}${escapeXml(parentList)}</title></g>`);
	});

	out.push(renderFooter(width, treeHeight + 24, converged), "</svg>");
	return out.join("\n");
}

const doc = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const deref = resolveBackReferences(doc);
const graph = buildGraph(doc.root, deref);
layout(graph.root);
fs.writeFileSync(OUTPUT, render(graph));

const converged = new Set(graph.convergenceEdges.map((e) => e.to));
console.log(`${OUTPUT}: ${graph.vertices.length} nodes, ${graph.convergenceEdges.length} convergence edges into ${converged.size} nodes`);
