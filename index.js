var fs = require('fs'),
    util = require('util');

var formatV1 = 'esriMapCacheStorageModeCompact';
var formatV2 = 'esriMapCacheStorageModeCompactV2';

function guessStorageFormat(root) {
    // TODO: not impl now
    return formatV1;
}

/**
 * Constructor for the tiler-arcgis-bundle
 *
 * @param {String} root - the root folder of ArcGIS bundle tiles, where the Conf.xml stands.
 * @param {Object} options - options passed in.
 * @param {integer} options.packSize - packet size.
 * @param {String} options.storageFormat - bundle storage format.
 * @class
 */
function tiler(root, options) {
    this.root = root;
    options = options || {};
    options.packSize = options.packSize || 128;
    if (!options.storageFormat) {
        options.storageFormat = guessStorageFormat(root);
    }
    this.options = options;
}


/**
 * Get a tile, Schema is XYZ.
 * Structure of the result tile is :
 * {
 *  lastModified : {Date} Time when tile file last modified
 *  data         : {Buffer}
 * }
 * @param {Number} x - tile x coordinate.
 * @param {Number} y - tile y coordinate.
 * @param {Number} z - tile z coordinate.
 * @param {Function(error, tile)} callback - tile x coordinate.
 * @return  {Object} tile data.
 */
tiler.prototype.getTile = function (x, y, z, callback) {
    var packSize = this.options.packSize;
    var format = this.options.storageFormat;
    var rGroup = parseInt(packSize * parseInt(y / packSize));
    var cGroup = parseInt(packSize * parseInt(x / packSize));
    var bundleBase = getBundlePath(this.root, z, rGroup, cGroup);
    var bundleFileName = bundleBase + ".bundle";
    var context = {
        bundleFileName: bundleFileName,
        storageFormat: format
    };
    if (format === formatV1) {
        context.bundlxFileName = bundleBase + ".bundlx";
        context.index = packSize * (x - cGroup) + (y - rGroup);
    } else if (format === formatV2) {
        context.index = packSize * (y - rGroup) + (x - cGroup);
    } else {
        callback(new Error('Unsupported format: ', format));
        return;
    }

    fs.stat(bundleFileName, function (err, stats) {
        if (err) {
            callback(err);
            return;
        }
        readTileFromBundle(context, function (err, bytesRead, buffer) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, {
                'lastModified': stats.mtime,
                'data': buffer
            })
        });
    });
}

function readTileFromBundle(context, callback) {
    if (context.storageFormat === formatV1) {
        readTileFromBundleV1(context, callback);
        return;
    }
    readTileFromBundleV2(context, callback);
}

function readTileFromBundleV1(context, callback) {
    var bundlxFileName = context.bundlxFileName;
    var bundleFileName = context.bundleFileName;
    var index = context.index;
    //get tile's offset in bundleFile from bundlxFile
    var buffer = new Buffer(5);
    fs.open(bundlxFileName, 'r', function (err, lxfd) {
        if (err) {
            callback(err);
            return;
        }
        fs.read(lxfd, buffer, 0, buffer.length, 16 + 5 * index, function (err, bytesRead, buffer) {
            fs.closeSync(lxfd);
            if (err) {
                callback(err);
                return;
            }
            //offset for tile data in bundleFile
            var offset = buffer.readIntLE(0, 5);
            readTile(bundleFileName, offset, callback);
        });
    });

}

function readTileFromBundleV2(context, callback) {
    var bundleFileName = context.bundleFileName;
    var index = context.index;
    fs.open(bundleFileName, 'r', function (err, fd) {
        if (err) {
            callback(err);
            return;
        }
        var offsetBuffer = new Buffer(4);
        fs.read(fd, offsetBuffer, 0, offsetBuffer.length, 64 + 8 * index, function (err, bytesRead, buffer) {
            // TODO: reuse fd???
            fs.closeSync(fd);
            if (err) {
                callback(err);
                return;
            }
            var dataOffset = offsetBuffer.readInt32LE();
            var lengthOffset = dataOffset - 4;
            readTile(bundleFileName, lengthOffset, callback);
        })
    });
}

function readTile(bundleFileName, offset, callback) {
    fs.open(bundleFileName, 'r', function (err, fd) {
        if (err) {
            callback(err);
            return;
        }
        //the start 4 bytes are the length of the tile data.
        var lengthBytes = new Buffer(4);
        fs.read(fd, lengthBytes, 0, lengthBytes.length, offset, function (err, bytesRead, buffer) {
            if (err) {
                fs.closeSync(fd);
                callback(err);
                return;
            }
            var length = lengthBytes.readInt32LE();
            var tileData = new Buffer(length);
            fs.read(fd, tileData, 0, tileData.length, offset + 4, function (err, bytesRead, buffer) {
                fs.closeSync(fd);
                callback(err, bytesRead, buffer);
            });
        });
    });

}

function getBundlePath(root, level, rGroup, cGroup) {
    var bundlesDir = root;
    var l = level.toString();
    var lLength = l.length;
    if (lLength < 2) {
        for (var i = 0; i < 2 - lLength; i++) {
            l = "0" + l;
        }
    }
    l = "L" + l;

    var r = parseInt(rGroup, 10).toString(16);
    var rLength = r.length;
    if (rLength < 4) {
        for (var i = 0; i < 4 - rLength; i++) {
            r = "0" + r;
        }
    }
    r = "R" + r;

    var c = parseInt(cGroup, 10).toString(16);
    var cLength = c.length;
    if (cLength < 4) {
        for (var i = 0; i < 4 - cLength; i++) {
            c = "0" + c;
        }
    }
    c = "C" + c;
    var bundlePath = util.format("%s/_alllayers/%s/%s%s", bundlesDir,
        l, r, c);
    return bundlePath;
}

exports = module.exports = tiler;
