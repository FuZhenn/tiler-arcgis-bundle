var Tiler = require('../index'),
  fs = require('fs'),
  assert = require('assert');

var tiler = new Tiler(__dirname + '/newbundle', {storageFormat: 'esriMapCacheStorageModeCompactV2'});

tiler.getTile(0x359, 0x1a2, 10, function(error, tile) {
  if (error) {
    throw error;
  }
  assert.ok(tile);
  assert.ok(!isNaN(Date.parse(tile.lastModified)));
  assert.deepEqual(tile.data.slice(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  console.log('success!');
});
