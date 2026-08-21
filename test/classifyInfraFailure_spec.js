require("mocha");
const { expect } = require("chai");
const { classifyInfraFailure } = require("../features/support/classify-infra-failure");
const { GPS_LOCK_NOT_OBTAINED } = require("../features/support/environmental-failures");

const alive = async () => true;
const dead = async () => false;
const HOOK_TIMEOUT = "function timed out, ensure the promise resolves within 120000 milliseconds";

describe("infra-failure classifier", function () {
    // The regression that let the flake through: a Before-hook (app-launch)
    // timeout whose Appium session was *momentarily alive* fell through every
    // branch and was left unmarked. One unmarked failure makes
    // infra.length !== failedCount in CucumberLauncher, so the whole
    // fresh-device reboot-retry is skipped and the run stays red.
    it("routes a Before-hook failure to a fresh device (environmental) even when the session is still alive", async function () {
        expect(await classifyInfraFailure({
            beforeHookCompleted: false, message: HOOK_TIMEOUT, sessionAlive: alive,
        })).to.equal("environmental");
    });

    // A fresh session on the same still-contended emulator can't cure a wedged
    // cold launch — an app-launch failure needs a fresh DEVICE regardless.
    it("routes a Before-hook failure to a fresh device even when the session died", async function () {
        expect(await classifyInfraFailure({
            beforeHookCompleted: false, message: "A session is either terminated or not started", sessionAlive: dead,
        })).to.equal("environmental");
    });

    it("does not probe session liveness for a Before-hook failure", async function () {
        let called = false;
        await classifyInfraFailure({
            beforeHookCompleted: false, message: HOOK_TIMEOUT,
            sessionAlive: async () => { called = true; return true; },
        });
        expect(called).to.equal(false);
    });

    // Failures during the scenario body keep the existing behaviour.
    it("marks a dropped session mid-scenario as session-dead (cheap fresh-session re-run)", async function () {
        expect(await classifyInfraFailure({
            beforeHookCompleted: true, message: "boom", sessionAlive: dead,
        })).to.equal("session-dead");
    });

    it("marks a known environmental wait failure as environmental", async function () {
        expect(await classifyInfraFailure({
            beforeHookCompleted: true, message: "Error: " + GPS_LOCK_NOT_OBTAINED, sessionAlive: alive,
        })).to.equal("environmental");
    });

    it("leaves a genuine assertion failure unmarked so it stays red (no retry)", async function () {
        expect(await classifyInfraFailure({
            beforeHookCompleted: true, message: "expected 42 to equal 7", sessionAlive: alive,
        })).to.equal(null);
    });
});
