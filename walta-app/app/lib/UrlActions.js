function create({ cerdiApi, onLoggedIn }) {
  const actions = {
    login: {
      params: ["email", "password"],
      handler: ({ email, password }) => {
        if (typeof Ti !== 'undefined') {
          Ti.API.debug(`[walta-deeplink] login handler: serverUrl=${cerdiApi.serverUrl} email=${email}`);
        }
        return cerdiApi.loginUser(email, password)
          .then((resp) => {
            if (typeof Ti !== 'undefined') Ti.API.debug(`[walta-deeplink] login resolved`);
            return onLoggedIn();
          })
          .catch((err) => {
            if (typeof Ti !== 'undefined') Ti.API.error(`[walta-deeplink] login failed: ${err && err.message}`);
            throw err;
          });
      }
    }
  };

  function parse(url) {
    // Manual parser — Titanium 13.x's V8 doesn't expose the WHATWG URL
    // constructor in the JS runtime, so `new URL(...)` throws and the
    // dispatch silently returns. Format: walta://<action>?k=v&k=v
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
    const action = actions[parsed.name];
    if (!action) return;
    const args = {};
    action.params.forEach(k => { args[k] = parsed.params[k]; });
    return action.handler(args);
  }

  return { dispatch, actions };
}

module.exports = { create };
