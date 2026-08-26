require("mocha");
const { expect } = require("chai");
const screenMetrics = require("../../walta-app/app/lib/util/screenMetrics");

describe("screenMetrics", function () {

	it("keeps iOS dimensions as reported, because iOS already reports points", function () {
		const metrics = screenMetrics({ platformWidth: 874, platformHeight: 402, logicalDensityFactor: 3 }, "iphone");
		expect(metrics.relWidth).to.equal(874);
		expect(metrics.relHeight).to.equal(402);
	});

	it("converts Android dimensions to dp, because Android reports pixels", function () {
		const metrics = screenMetrics({ platformWidth: 2400, platformHeight: 1080, logicalDensityFactor: 2.625 }, "android");
		expect(metrics.relWidth).to.be.closeTo(914.3, 0.1);
		expect(metrics.relHeight).to.be.closeTo(411.4, 0.1);
	});

	// The app runs landscape, but the platform can report the portrait-oriented
	// dimensions, so relHeight must always end up the short edge.
	it("normalises portrait-reported dimensions so relHeight is the short edge", function () {
		const metrics = screenMetrics({ platformWidth: 402, platformHeight: 874, logicalDensityFactor: 3 }, "iphone");
		expect(metrics.relWidth).to.equal(874);
		expect(metrics.relHeight).to.equal(402);
	});

	it("reports the landscape aspect ratio", function () {
		const metrics = screenMetrics({ platformWidth: 800, platformHeight: 400, logicalDensityFactor: 1 }, "iphone");
		expect(metrics.aspectRatio).to.equal(2);
	});

	it("calls a screen square when it is proportionally wider than 3:2", function () {
		expect(screenMetrics({ platformWidth: 1000, platformHeight: 700, logicalDensityFactor: 1 }, "ipad").isSquare).to.equal(true);
		expect(screenMetrics({ platformWidth: 1000, platformHeight: 600, logicalDensityFactor: 1 }, "ipad").isSquare).to.equal(false);
	});

	describe("size buckets", function () {
		function bucketOf(relHeight) {
			var metrics = screenMetrics({ platformWidth: relHeight * 2, platformHeight: relHeight, logicalDensityFactor: 1 }, "iphone");
			if (metrics.isLowRes) { return "low"; }
			if (metrics.isHighRes) { return "high"; }
			if (metrics.isXHighRes) { return "xhigh"; }
			return "none";
		}

		it("puts screens under 300dp tall in the low bucket", function () {
			expect(bucketOf(299)).to.equal("low");
		});

		it("puts screens from 300dp to under 700dp tall in the high bucket", function () {
			expect(bucketOf(300)).to.equal("high");
			expect(bucketOf(699)).to.equal("high");
		});

		it("puts screens 700dp tall and over in the extra-high bucket", function () {
			expect(bucketOf(700)).to.equal("xhigh");
		});
	});

	// The regression this module exists for: an iPhone and an Android phone of
	// near-identical physical size must land in the same bucket.
	describe("real devices", function () {
		it("puts an iPhone in the same bucket as an Android phone of the same physical size", function () {
			const iphone17Pro = screenMetrics({ platformWidth: 874, platformHeight: 402, logicalDensityFactor: 3 }, "iphone");
			const mediumPhone = screenMetrics({ platformWidth: 2400, platformHeight: 1080, logicalDensityFactor: 2.625 }, "android");
			expect(iphone17Pro.isHighRes).to.equal(true);
			expect(mediumPhone.isHighRes).to.equal(true);
		});

		it("puts a Nexus 5 in the high bucket", function () {
			expect(screenMetrics({ platformWidth: 1920, platformHeight: 1080, logicalDensityFactor: 3 }, "android").isHighRes).to.equal(true);
		});

		it("puts an iPad in the extra-high bucket", function () {
			expect(screenMetrics({ platformWidth: 1366, platformHeight: 1024, logicalDensityFactor: 2 }, "ipad").isXHighRes).to.equal(true);
		});
	});

});
