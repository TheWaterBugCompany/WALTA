Backbone.sync = function(method, model, options) {
    // overrides fetch() to trigger a bind via change()
    if (model instanceof Backbone.Collection) {
        console.warn("Collection sync: " + method);
    } else {
        console.warn("model sync: " + method);
    }

    model.trigger("change");
    options.success(model.toJSON());
};

exports.createModel = function(name, attributes) {
    Alloy.Models[name] = new Backbone.Model(attributes);
    return Alloy.Models[name];
};

exports.createCollection = function(name, content) {
    Alloy.Collections[name] = new Backbone.Collection();
    if (content instanceof Array) {
        Alloy.Collections[name].reset(content);
    }
    return Alloy.Collections[name];
};
