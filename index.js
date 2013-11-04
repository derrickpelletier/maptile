/*
 * A couple of the math transforms were taken from Leaflet, here: https://github.com/Leaflet/Leaflet
 * This module can be used to declare map-tile collections
 * A builder can be declared to build non-existant tiles and store them to disk
 * Storage can be bypassed altogether if desired and rely solely on real-time generation
 */

var fs = require('fs')
  , util = require('util')
  , mkdirp = require('mkdirp')
  , proj4 = require('proj4')

// 
// google projection for conversions
// 
proj4.defs([
  ["EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"]
])

var transform_vars = [0.5 / Math.PI, 0.5, 0.5 / Math.PI, 0.5]
var earth_radius = 6378137

// 
// Map object, represents a collection of tiles for specific purpose.
// 
var Map = module.exports = function(options){
  var defaults = {
      type: "tms"
    , tile_size: 256
    , path: './tiles/'
    , cache: true
    , builder: null
  }
  options = options || {}
  for (var attrname in defaults) {
    this[attrname] = options.hasOwnProperty(attrname) && options[attrname] !== null ? options[attrname] : defaults[attrname]
  }
}

// 
// Callback with the following pattern:
// (err, tile-buffer-data)
// 
Map.prototype.getTile = function(opts, next) {
  var self = this
  var file_path = this.path + util.format("%d/%d/%d.png", opts.z, opts.x, opts.y)
  if(this.cache && fs.existsSync(file_path)) {
    fs.readFile(file_path, next)
  } else if(this.builder) {
    this.builder.call(self, opts, function(buffer){
      next(null, buffer)
      if(!self.cache) return
      mkdirp.sync(util.format(self.path + "%d/%d/", opts.z, opts.x))
      fs.writeFile(file_path, buffer, function(){ /* wrote the file, emit an event? */ })
    })
  }
}

// 
// Conversion methods, self explanitory
// 
Map.prototype.lonLatToPixels = function (lon, lat, zoom) {
  // spherical mercator...
  var d = Math.PI / 180
    , max = 85.0511287798 //max latitutude
    , lat = Math.max(Math.min(max, lat), -max)
    , x = lon * d
    , y = Math.log(Math.tan((Math.PI / 4) + (lat * d / 2)));
  return this.transform(x, y, zoom)
}

Map.prototype.metersToPixels = function(x, y, zoom) {
  return this.transform(x / earth_radius, y / earth_radius, zoom)
}

Map.prototype.metersToLonLat = function(x, y) {
  return proj4(proj4.defs['EPSG:3857'], proj4.WGS84, [x,y])
}

Map.prototype.pixelsToLonLat = function(px, py, zoom){
  var coords = this.untransform(px, py, zoom)
  var lon = coords[0] * 180 / Math.PI
    , lat = (2 * Math.atan(Math.exp(coords[1])) - (Math.PI / 2)) * 180 / Math.PI;
  return [lon, lat]
}

Map.prototype.transform = function(x, y, zoom) {
  var scale = this.tile_size * Math.pow(2, zoom)
  x = scale * (transform_vars[0] * x + transform_vars[1])
  y = scale * (transform_vars[2] * y + transform_vars[3])
  return [x, y]
}

Map.prototype.untransform = function(x, y, zoom) {
  var scale = this.tile_size * Math.pow(2, zoom)
  x = (x / scale - transform_vars[1]) / transform_vars[0]
  y = (y / scale - transform_vars[3]) / transform_vars[2]
  return [x, y]
}

// Returns bounds of the given tile in lon/lat coordinates
Map.prototype.tileBounds = function(tx, ty, zoom) {
  return {
      min: this.pixelsToLonLat(tx * this.tile_size, ty * this.tile_size, zoom)
    , max: this.pixelsToLonLat((tx + 1) * this.tile_size, (ty + 1) * this.tile_size, zoom)
  }
}

Map.prototype.getGeoJSONBounds = function(opts) {
  var bounds = this.tileBounds(opts.x, opts.y, opts.z, this.tile_size)
  return [[
      [bounds.min[0], bounds.min[1]]
    , [bounds.min[0], bounds.max[1]]
    , [bounds.max[0], bounds.max[1]]
    , [bounds.max[0], bounds.min[1]]
    , [bounds.min[0], bounds.min[1]]
  ]]
}

Map.prototype.getLonLatBounds = Map.prototype.tileBounds;

Map.prototype.getPixelBounds = function(opts) {
  return {
      min: [opts.x * this.tile_size, opts.y * this.tile_size]
    , max: [(opts.x + 1) * this.tile_size, (opts.y + 1) * this.tile_size]
  }
}

// 
// Get the pixel-offset of the coordinates relative to the top-left of the tiles pixel position.
// Used to draw points in a tile.
// 
Map.prototype.getOffset = function(tile_pixels, coordinates, zoom) {
  var pixel_coords = this.lonLatToPixels(coordinates[0], coordinates[1], zoom)
  return [Math.round(pixel_coords[0] - tile_pixels[0]), Math.round(tile_pixels[1] - pixel_coords[1])]
}