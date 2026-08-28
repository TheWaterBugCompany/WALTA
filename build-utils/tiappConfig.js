// Renders walta-app/tiapp.xml from tiapp.xml.template at build time. The template
// is committed; the generated file is not, because it carries the maps key.

const MAPS_KEY_PLACEHOLDER = "GOOGLE_MAPS_API_KEY_PLACEHOLDER";

export function renderTiapp(template, { mapsApiKey } = {}) {
    return template.split(MAPS_KEY_PLACEHOLDER).join(mapsApiKey || "");
}
