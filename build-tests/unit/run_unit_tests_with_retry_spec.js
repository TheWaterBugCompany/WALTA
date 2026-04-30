import { expect } from "chai";
import { spawnSync } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Wraps `npx grunt unit-test` for CI: distinguishes a deterministic
// test failure (exit 2 from grunt — don't retry) from an infrastructure
// flake (any other non-zero exit — retry once). Tests here drive bash
// behaviour by passing a fixture script as the inner command and
// asserting on exit code + invocation count.
const SCRIPT = path.resolve("build-utils/run-unit-tests-with-retry.sh");

describe("run-unit-tests-with-retry.sh", function () {
    let tmp;
    let counter;

    beforeEach(function () {
        tmp = mkdtempSync(path.join(tmpdir(), "wb48-retry-"));
        counter = path.join(tmp, "counter");
    });

    function writeInnerScript(body) {
        const innerPath = path.join(tmp, "inner.sh");
        writeFileSync(innerPath, "#!/usr/bin/env bash\n" + body + "\n");
        chmodSync(innerPath, 0o755);
        return innerPath;
    }

    function attemptCount() {
        try { return readFileSync(counter, "utf8").split("\n").filter(Boolean).length; }
        catch { return 0; }
    }

    it("exits 0 when the inner command exits 0 — no retry", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; exit 0`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(0);
        expect(attemptCount()).to.equal(1);
    });

    it("exits 1 without retrying when the inner command exits 2 (deterministic failure)", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; exit 2`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(1);
        expect(attemptCount()).to.equal(1);
    });

    it("retries once when the inner command exits non-zero with code != 2 (infra flake)", function () {
        // First call exits 1 (treated as infra flake); second call succeeds.
        const inner = writeInnerScript(`
            echo "attempt" >> "${counter}"
            COUNT=$(wc -l < "${counter}" | tr -d ' ')
            if [ "$COUNT" = "1" ]; then
                exit 1
            else
                exit 0
            fi
        `);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(0);
        expect(attemptCount()).to.equal(2);
    });

    it("returns the second attempt's exit code if the retry also fails (with non-2 exit)", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; exit 7`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(7);
        expect(attemptCount()).to.equal(2);
    });

    it("does not retry if the second attempt's exit would also be 2 — but second attempt's exit 2 still maps to wrapper exit 2", function () {
        // Edge: first attempt is treated as infra flake (e.g. exit 1),
        // retry runs the suite, and *that* exits 2 (deterministic test
        // failure on the retry). The wrapper just returns the second
        // attempt's raw exit code in that case — exit 2 propagates.
        const inner = writeInnerScript(`
            echo "attempt" >> "${counter}"
            COUNT=$(wc -l < "${counter}" | tr -d ' ')
            if [ "$COUNT" = "1" ]; then
                exit 1
            else
                exit 2
            fi
        `);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(2);
        expect(attemptCount()).to.equal(2);
    });
});
