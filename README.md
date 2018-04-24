# tiler-arcgis-bundle

[![Circle CI](https://circleci.com/gh/fuzhenn/tiler-arcgis-bundle.svg?style=svg)](https://circleci.com/gh/fuzhenn/tiler-arcgis-bundle)

A nodejs map tile reader for compact tile storage format used by ESRI ArcGIS

## Introduction
[ArcGIS Compact Tile](https://server.arcgis.com/zh-cn/server/latest/publish-services/windows/inside-the-compact-cache-storage-format.htm) is a tile format since ArcGIS version 10.1

It bundles exploded tile files into a .bundlx and a .bundle file and really reduces number of tile files.

This library is a reader for the bundles.

## See Also
[tiler-file](https://github.com/FuZhenn/tiler-file):
a nodejs map tile file reader coordinating by X,Y,Z

[tiler-arcgis-file](https://github.com/FuZhenn/tiler-arcgis-file):
a nodejs map tile reader for exploded tiles cache format by ESRI ArcGIS

## Install

```bash
npm install tiler-arcgis-bundle
```

## Usage

```javascript
var Tiler = require('tiler-arcgis-bundle');
//root folder of the tiles, where the Conf.xml stands
//128 is the packet size (row count and col count) of a tile bundle, default is 128
var tiler = new Tiler('/home/foo/bundle_tiles/', { packSize: 128 });
//tile's x,y,z
tiler.getTile(3408, 2417, 2, function(error, tile) {
    if (error) {
        throw error;
    }
    console.log(tile.lastModified);
    fs.writeFileSync('foo.png', tile.data);
});
```
