'use strict';

var expect = require('expect');
var jsdom = require('jsdom').jsdom;

describe('the plugin manager', function() {
	var document = jsdom('<div id="a-div">With content.</div>');
	global.window = document.parentWindow;
	global.getComputedStyle = function() {};
	global.document = document;

	var myModule = {
		type: 'AlsoMine',
		func: function() {
			return 4;
		}
	};
	var myDep = {
		type: 'Dep',
		func: function () {
			return 3;
		}
	};
	var myModuleWithDep = {
		type: 'Mine',
		deps: ['Dep'],
		func: function(dep) {
			return dep();
		}
	};

	var createAModuleToExecuteTest = function(deps, vaidationCode) {
		return {
			type: 'Test',
			deps: deps,
			func: vaidationCode
		};
	};
	var pluginManager;

	describe('using a module', function() {
		beforeEach(function () {
			pluginManager = require('../src/plug-n-play').configure(['InputMode']);
		});

		it('should have it\'s dependencies injected as parameters', function() {
			pluginManager.load(myDep);
			pluginManager.load(myModuleWithDep);

			pluginManager.load(createAModuleToExecuteTest(['Mine'], function(mine) {
				expect(mine()).toEqual(3);
			}));
		});

		it('should still work for modules without dependencies', function () {
			pluginManager.load(myModule);

			pluginManager.load(createAModuleToExecuteTest(['AlsoMine'], function(alsoMine) {
				expect(alsoMine()).toEqual(4);
			}));
		});

		it('should all multiple plugins for specific plugin-types', function() {
			var inputMode = {
				type: 'InputMode',
				func: function() { return undefined; }
			};
			pluginManager.load(inputMode);
			pluginManager.load(inputMode);

			pluginManager.load(createAModuleToExecuteTest(['InputMode'], function(inputMode) {
				expect(inputMode().length).toEqual(2);
			}));
		});

		it('should defer all modules', function () {
			var loadedSecondNeededInFirst = {
				type: 'LaterDude',
				func: function() { return 'Holla'; }
			};
			var loadedFirstRequiresSecondDefine = {
				deps: ['LaterDude'],
				type: 'NowNowNow',
				func: function(laterDude, OkNow) {
					return {
						LaterDude: function () { return laterDude(); },
						OkNow: OkNow
					};
				}
			};

			pluginManager.load(loadedFirstRequiresSecondDefine);
			pluginManager.load(loadedSecondNeededInFirst);

			pluginManager.load(createAModuleToExecuteTest(['NowNowNow'], function(nowNowNow) {
				expect(nowNowNow().LaterDude).toNotEqual('Holla');
				expect(nowNowNow().LaterDude()).toEqual('Holla');
			}));
		});

		it('should raise an exception if a dependency is used during the load phase', function () {
			var now = {
				deps: ['OkNow'],
				type: 'NowNowNow',
				func: function(okNow) {
					return okNow();
				}
			};

			try {
				pluginManager.load(now);
			} catch (e) {
				expect(true).toBe(true);
				return;
			}

			expect(true).toBe(false);
		});

		it('should raise an exception if the dependency is not defined', function () {
			try {
				pluginManager.load(createAModuleToExecuteTest(['NotDefined'], function(PM) {
					expect(PM).toEqual(pluginManager);
				}));
			} catch (e) {
				expect(true).toBe(true);
				return;
			}

			expect(true).toBe(false);
		});
	});

	describe('getting a module', function() {
		it('should return the module set by the developer', function() {
			expect(pluginManager.get('AlsoMine')).toEqual(4);
		});
	});

	describe('setting a property', function() {
		it('should set the property', function() {
			pluginManager.set('P', 1);

			pluginManager.load(createAModuleToExecuteTest(['P'], function(p) {
				expect(p()).toEqual(1);
			}));
		});
	});
});