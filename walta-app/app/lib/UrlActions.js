// Generic walta:// deeplink dispatcher. It knows nothing about specific
// actions — it parses walta://<name>?k=v&k=v and calls the matching handler
// with the parsed params. The action catalog is declared once in
// buildActions(); adding an action touches only that catalog, not this
// dispatch mechanism. index-app.js wires the two together.
function create(actions) {
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

  function dispatch(url) {
    const parsed = parse(url);
    if (!parsed) return;
    const handler = actions[parsed.name];
    if (!handler) return;
    return handler(parsed.params);
  }

  return { dispatch, actions };
}

// The declarative action catalog. Dev-only actions (reset wipes user data,
// ballast balloons memory for WB-118 repro) are included only when allowDev —
// index-app passes deployType !== 'production' — so a release build can never
// be wiped or memory-ballooned by a stray walta:// URL.
function buildActions({ cerdiApi, onLoggedIn, appReset, setBallast, allowDev }) {
  const actions = {
    login: ({ email, password }) => {
      if (typeof Ti !== 'undefined') {
        Ti.API.debug(`[walta-deeplink] login handler: serverUrl=${cerdiApi.serverUrl} email=${email}`);
      }
      return cerdiApi.loginUser(email, password)
        .then(() => {
          if (typeof Ti !== 'undefined') Ti.API.debug(`[walta-deeplink] login resolved`);
          return onLoggedIn();
        })
        .catch((err) => {
          if (typeof Ti !== 'undefined') Ti.API.error(`[walta-deeplink] login failed: ${err && err.message}`);
          throw err;
        });
    },
  };

  if (allowDev) {
    actions.reset = () => Promise.resolve(appReset());
    actions.ballast = ({ mb }) => Promise.resolve(setBallast(parseInt(mb, 10) || 0));
  }

  return actions;
}

module.exports = { create, buildActions };
