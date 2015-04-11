'use strict';

var addTrailingSlash = function(path) {
	return path.substr(-1) === '/' ? path : path + '/';
};

var normaliseRelativePath = function(path) {
	return path.substr(0, 1) === '/' ? path : require('path').join(__dirname, path);
};

module.exports = {
	loadFromPath: function(pathToEntites, callback) {
		var absolutePath = normaliseRelativePath(addTrailingSlash(pathToEntites));

		var exports = {};

		require('fs').readdirSync(absolutePath).forEach(function(file){
			if (file.substr(-3) !== '.js') {
				return;
			}

			var name = file.replace('.js', '');

			if (callback) {
				callback(require(absolutePath + file));
			} else {
				exports[name] = require(absolutePath + file);
			}
		});

		return exports;
	}
};