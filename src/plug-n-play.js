'use strict';

var loader = require('./folder-loader.js');
var isArray = require('lodash').isArray;
var each = require('lodash').each;
var contains = require('lodash').contains;

var plugins = {};
var defaultModes = [];

var get = function (name) {
  if (!plugins[name]) {
    throw new Error('No plugin defined for: ' + name);
  }

  return plugins[name];
};

//jshint maxcomplexity:false
var load = function (module) {
  module.deps = module.deps || [];

  var args = [];
  var i;

  var deferredDependency = function (deferred) {
    return function () {
      if (arguments.length > 0) {
        throw new Error('Incorrect use of deferred dependency. You\'re probably going blah(p1, p2) when you should be going blah()(p1, p2).');
      }

      return get(deferred);
    };
  };

  var dep;
  for (i = 0; i < module.deps.length; i += 1) {
    dep = module.deps[i];

    args.push(deferredDependency(dep));
  }

  if (isArray(plugins[module.type])) {
    plugins[module.type].push(module.func.apply(this, args));
  } else {
    plugins[module.type] = module.func.apply(this, args);
  }

  if (contains(defaultModes, module.type)) {
    if (!(plugins[module.type] instanceof Array)) {
      plugins[module.type] = ['*', plugins[module.type]];
    }
  }
};

var loadPath = function (path) {
  loader.loadFromPath(path, load);
};

var set = function (name, thing) {
  plugins[name] = thing;
};

var define = function (type, deps, func) {
  if (deps instanceof Function) {
    return {
      type: type,
      func: deps
    };
  } else {
    return {
      type: type,
      deps: deps,
      func: func
    };
  }
};

load({
  type: 'DefinePlugin',
  func: function () {
    return function (type, deps, func) {
      load(define(type, deps, func));
    };
  }
});

module.exports = {
  configure: function(arrays, defaultMode) {
    arrays = arrays || [];
    defaultMode = defaultMode || [];

    each(arrays, function(name) {
      plugins[name] = [];
    });

    defaultModes = defaultMode;

    return {
      load: load,
      loadPath: loadPath,
      set: set,
      get: get
    };
  }
};