'use strict';

var loader = require('./folder-loader.js');
var isArray = require('lodash').isArray;
var each = require('lodash').each;
var contains = require('lodash').contains;
var log = require('./logger.js');

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
  log.loaded(module.type);

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

  var wrapOriginalFunction = function(original) {
    return function () {
      log.plugin(arguments, module.type, original.toString());

      return original.apply(arguments);
    };
  };

  function addLoggingToPlugin (func) {
    var plugin = func.apply(undefined, args);

    if (plugin instanceof Function) {
      return wrapOriginalFunction(plugin);
    }
    if (plugin instanceof Array) {
      return plugin;
    }
    if (!(plugin instanceof Object)) {
      return plugin;
    }
    for (var key in plugin) {
      if (plugin[key] instanceof Function) {
        plugin[key] = wrapOriginalFunction(plugin[key]);
      }
    }

    return plugin;
  }

  function setModesForPlugin (plugin) {
    if (!contains(defaultModes, module.type)) {
      return plugin;
    }
    if (!(plugin instanceof Array)) {
      return [['*'], plugin];
    }
    if (!(plugin[0] instanceof Array)) {
      return [[plugin[0]], plugin[1]];
    }

    return plugin;
  }

  var preparedPlugin = setModesForPlugin(addLoggingToPlugin(module.func));

  if (isArray(plugins[module.type])) {
    plugins[module.type].push(preparedPlugin);
  } else {
    plugins[module.type] = preparedPlugin;
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