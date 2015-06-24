'use strict';

var bunyan = require('bunyan');
var appRoot = require('app-root-path');
var packageInfo = require(appRoot + '/package.json');

var log = bunyan.createLogger({
  name: packageInfo.name + '@' + packageInfo.version,
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    }
  ]
});

function filename (fullPath, dirname) {
  return fullPath.replace(dirname, '');
}

function extractFunctionNameFromCode (code) {
  var name = code.toString();
  var start = name.indexOf(' ') + 1;
  var finish = name.indexOf('(');

  return name.substring(start, finish);
}

function loaded (pluginType) {
  log.info(pluginType + ' loaded.');
}

function called (args, filename, code) {
  log.info(filename + ':' + extractFunctionNameFromCode(code));
  log.debug(args, filename + ':' + extractFunctionNameFromCode(code));
}

log.filename = filename;
log.loaded = loaded;
log.called = called;
log.plugin = called;

module.exports = log;