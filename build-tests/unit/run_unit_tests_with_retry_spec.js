import { expect } from "chai";
import { spawnSync } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Wraps `npx grunt unit-test` for CI: distinguishes a deterministic
// test failure (UNIT_TESTS_FAILED in stdout — don't retry) from an
// infrastructure flake (any other non-zero exit — retry once). Tests
// here drive bash behaviour by passing a fixture script as the inner
// command and asserting on exit code + invocation count.
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

    it("exits 0 when the inner command succeeds — no retry", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; echo PASS; exit 0`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(0);
        expect(attemptCount()).to.equal(1);
    });

    it("exits 1 without retrying when stdout contains UNIT_TESTS_FAILED", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; echo "303 passing"; echo UNIT_TESTS_FAILED; exit 3`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(1);
        expect(attemptCount()).to.equal(1);
    });

    it("retries once on non-zero exit without the marker (infra flake)", function () {
        // First call exits 1 silently; second call succeeds.
        const inner = writeInnerScript(`
            echo "attempt" >> "${counter}"
            COUNT=$(wc -l < "${counter}" | tr -d ' ')
            if [ "$COUNT" = "1" ]; then
                echo "AAPT: Theme.WaterbugApp not found"
                exit 1
            else
                echo PASS
                exit 0
            fi
        `);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(0);
        expect(attemptCount()).to.equal(2);
    });

    it("returns the second attempt's exit code if the retry also fails (without marker)", function () {
        const inner = writeInnerScript(`echo "attempt" >> "${counter}"; exit 7`);
        const result = spawnSync("bash", [SCRIPT, inner]);
        expect(result.status).to.equal(7);
        expect(attemptCount()).to.equal(2);
    });

    it("forwards the inner command's stdout to its own stdout", function () {
        const inner = writeInnerScript(`echo "hello from inner"; exit 0`);
        const result = spawnSync("bash", [SCRIPT, inner], { encoding: "utf8" });
        expect(result.stdout).to.contain("hello from inner");
    });
});
