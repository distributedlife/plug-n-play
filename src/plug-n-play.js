'use strict';

var loader = require('./folder-loader.js');
var isArray = require('lodash').isArray;
var each = require('lodash').each;
var map = require('lodash').map;
var contains = require('lodash').contains;
var logging = require('ensemblejs-logging');
var log;
var plugins = {};
var defaultModes = [];
var traceOnly = [];

function get (name) {
  if (!plugins[name]) {
    throw new Error('No plugin defined for: ' + name);
  }

  return plugins[name];
}

function deferredDependency (deferred) {
  return function () {
    if (arguments.length > 0) {
      throw new Error('Incorrect use of deferred dependency. You\'re probably going blah(p1, p2) when you should be going blah()(p1, p2).');
    }

    return get(deferred);
  };
}

function load (module, prefix) {
  prefix = prefix || 'ensemblejs';

  log.loaded(prefix + '::' + module.type);

  module.deps = module.deps || [];

  var args = [];
  var i;

  var dep;
  for (i = 0; i < module.deps.length; i += 1) {
    dep = module.deps[i];

    args.push(deferredDependency(dep));
  }

  function wrapOriginalFunction (original) {
    return function () {
      if (contains(traceOnly, module.type)) {
        log.subdue(arguments, prefix + ':' + module.type, original.toString());
      } else {
        log.plugin(arguments, prefix + ':' + module.type, original.toString());
      }

      return original.apply(this, arguments);
    };
  }

  function wrapEachElementOfArray (array) {
    return map(array, function (element) {
      if (element instanceof Function) {
        return wrapOriginalFunction(element);
      } else {
        return element;
      }
    });
  }

  function wrapEachFunctionInObject (obj) {
    for (var key in obj) {
      if (obj[key] instanceof Function) {
        obj[key] = wrapOriginalFunction(obj[key]);
      }
    }

    return obj;
  }

  function addLoggingToPlugin (func) {
    var plugin = func.apply(this, args);

    if (plugin instanceof Function) {
      return wrapOriginalFunction(plugin);
    }
    if (plugin instanceof Array) {
      return wrapEachElementOfArray(plugin);
    }
    if (!(plugin instanceof Object)) {
      return plugin;
    } else {
      return wrapEachFunctionInObject(plugin);
    }
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
}

function loadGameDevCode (path) {
  loader.loadFromPath(path, load);
}

function set (name, thing) {
  plugins[name] = thing;
}

function define (type, deps, func) {
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
}

function loadDefinedPlugin (type, deps, func) {
  load(define(type, deps, func));
}

function DefinePlugin () {
  return loadDefinedPlugin;
}

function configure (logger, arrays, defaultMode, traceOnlyPlugins) {
  log = logging.setupLogger(logger);

  arrays = arrays || [];
  defaultMode = defaultMode || [];
  traceOnlyPlugins = traceOnlyPlugins || [];

  each(arrays, function(name) {
    plugins[name] = [];
  });

  defaultModes = defaultMode;
  traceOnly = traceOnlyPlugins;

  load({
    type: 'DefinePlugin',
    func: DefinePlugin
  });
  // load({
  //   type: 'Logger',
  //   func: function () {
  //     return log;
  //   }
  // });

  return {
    load: load,
    loadPath: loadGameDevCode,
    set: set,
    get: get
  };
}

module.exports = {
  configure: configure
};