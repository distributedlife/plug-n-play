# plug-n-play

# usage
```javascript
var plugins = require('plug-n-play').configure(['Set']);
plugins.load(require('/path/to/set/plugin'));
plugins.load({
  type: 'MySweetPlugin'
  deps: ['Set']
  func: function(set) {
    return {
      count: function () {
        return set().length;
      }
    }
  };
});

var define = plugins.get('DefinePlugin');
define('Set', function() {
  return 4;
});

var mySweetPlugin = plugins.get('MySweetPlugin');
mySweetPlugin.count();
```