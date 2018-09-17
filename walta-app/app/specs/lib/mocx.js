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
    if (!Alloy.Models[name]) {
        Alloy.Models[name] = new Backbone.Model(attributes);
    }
    return Alloy.Models[name];
};

exports.createCollection = function(name, content) {
    if (!Alloy.Collections[name]) {
        Alloy.Collections[name] = new Backbone.Collection();
    }

    if (content instanceof Array) {
        Alloy.Collections[name].reset(content);
    } else {
        throw "No Array specified for createCollection";
    }
};
