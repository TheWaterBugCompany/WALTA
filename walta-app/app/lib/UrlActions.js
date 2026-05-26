const Topics = require("ui/Topics");
const AppReset = require("util/AppReset");
const MemoryBallast = require("util/MemoryBallast");
const Logger = require("util/Logger");
const log = (m) => Logger.log(m, "navigation");

// Manual parser — Titanium 13.x's V8 doesn't expose the WHATWG URL
// constructor in the JS runtime, so `new URL(...)` throws.
function parse(url) {
  const m = String(url || "").match(/^walta:\/\/([^/?#]+)(?:\?([^#]*))?/);
  if (!m) return null;
  const params = {};
  (m[2] || "").split("&").filter(Boolean).forEach(pair => {
    const eq = pair.indexOf("=");
    const k = eq === -1 ? pair : pair.slice(0, eq);
    const v = eq === -1 ? "" : pair.slice(eq + 1);
    params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return { name: m[1], params };
}

// Build a walta:// deeplink dispatcher for the given boundaries. The dispatch
// mechanism (parse walta://<name>?k=v and route to the matching handler) and
// the action catalog are composed here, so the caller wires one thing:
// `UrlActions.create({ cerdiApi, allowDev }).dispatch(url)`.
function create(deps) {
  const actions = buildActions(deps);
  function dispatch(url) {
    const parsed = parse(url);
    if (!parsed) return;
    const handler = actions[parsed.name];
    if (!handler) return;
    return handler(parsed.params);
  }
  return { dispatch };
}

// The declarative action catalog. cerdiApi (network) and allowDev (a Ti
// deployType value) are the only true boundaries index-app must supply;
// everything else is a collaborator this module owns and calls directly.
// Dev-only actions (reset wipes user data, ballast balloons memory for WB-118
// repro) are included only when allowDev — index-app passes
// deployType !== 'production' — so a release build can never be wiped or
// memory-ballooned by a stray walta:// URL.
function buildActions({ cerdiApi, allowDev }) {
  const actions = {
    login: ({ email, password }) => {
      if (typeof Ti !== 'undefined') {
        Ti.API.debug(`[walta-deeplink] login handler: serverUrl=${cerdiApi.serverUrl} email=${email}`);
      }
      return cerdiApi.loginUser(email, password)
        .then(() => {
          if (typeof Ti !== 'undefined') Ti.API.debug(`[walta-deeplink] login resolved`);
          Topics.fireTopicEvent(Topics.LOGGEDIN);
        })
        .catch((err) => {
          if (typeof Ti !== 'undefined') Ti.API.error(`[walta-deeplink] login failed: ${err && err.message}`);
          throw err;
        });
    },
  };

  if (allowDev) {
    actions.reset = () => AppReset.reset();
    actions.ballast = ({ mb }) => {
      const held = MemoryBallast.inflate(parseInt(mb, 10) || 0);
      log(`memory ballast: holding ${mb} MB to induce pressure`);
      return held;
    };
  }

  return actions;
}

module.exports = { create, buildActions };
