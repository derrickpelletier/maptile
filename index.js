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
  , canvas = require('canvas')

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
    this.builder.call(self, new Tile(opts, this), function(buffer){
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
var lonLatToPixels = function (lon, lat, zoom, tile_size) {
  // spherical mercator...
  var d = Math.PI / 180
    , max = 85.0511287798 //max latitutude
    , lat = Math.max(Math.min(max, lat), -max)
    , x = lon * d
    , y = Math.log(Math.tan((Math.PI / 4) + (lat * d / 2)));
  return transform(x, y, zoom, tile_size)
}

var metersToPixels = function(x, y, zoom, tile_size) {
  return transform(x / earth_radius, y / earth_radius, zoom, tile_size)
}

var metersToLonLat = function(x, y) {
  return proj4(proj4.defs['EPSG:3857'], proj4.WGS84, [x,y])
}

var pixelsToLonLat = function(px, py, zoom, tile_size){
  var coords = untransform(px, py, zoom, tile_size)
  var lon = coords[0] * 180 / Math.PI
    , lat = (2 * Math.atan(Math.exp(coords[1])) - (Math.PI / 2)) * 180 / Math.PI;
  return [lon, lat]
}

var transform = function(x, y, zoom, tile_size) {
  var scale = tile_size * Math.pow(2, zoom)
  x = scale * (transform_vars[0] * x + transform_vars[1])
  y = scale * (transform_vars[2] * y + transform_vars[3])
  return [x, y]
}

var untransform = function(x, y, zoom, tile_size) {
  var scale = tile_size * Math.pow(2, zoom)
  x = (x / scale - transform_vars[1]) / transform_vars[0]
  y = (y / scale - transform_vars[3]) / transform_vars[2]
  return [x, y]
}

// Returns bounds of the given tile in lon/lat coordinates
var tileBounds = function(tx, ty, zoom, tile_size) {
  return {
      min: pixelsToLonLat(tx * tile_size, ty * tile_size, zoom, tile_size)
    , max: pixelsToLonLat((tx + 1) * tile_size, (ty + 1) * tile_size, zoom, tile_size)
  }
}

// 
// Map object, represents a collection of tiles for specific purpose.
// 
var Tile = function(coords, map){
  var defaults = {
      x: 0
    , y: 0
    , z: 0
  }
  this.map = map
  coords = coords || {}
  for (var attrname in defaults) {
    this[attrname] = coords.hasOwnProperty(attrname) && coords[attrname] !== null ? coords[attrname] : defaults[attrname]
  }
}

// 
// Get the pixel-offset of the coordinates relative to the top-left of the tiles pixel position.
// Used to draw points in a tile.
// 
Tile.prototype.getOffset = function(coordinates) {
  var pixel_coords = lonLatToPixels(coordinates[0], coordinates[1], this.z, this.map.tile_size)
  var tile_pixels = this.getPixelBounds()
  return [Math.round(pixel_coords[0] - tile_pixels.min[0]), Math.round(tile_pixels.max[1] - pixel_coords[1])]
}


// 
// DRWWING THINGS!
// 
Tile.prototype.drawGeojson = function(points, settings, next) {
  if(typeof settings === 'function') {
    next = settings
  }
  var tile_canvas = new canvas(this.map.tile_size, this.map.tile_size)
    , ctx = tile_canvas.getContext('2d')
  ctx.fillStyle = settings.fillStyle
  for(var i in points) {
    var p = points[i]
    ctx.beginPath()
    if(p.type == "Point") {
      var offset = this.getOffset(p.coordinates)
      ctx.arc(offset[0], offset[1], 1, 0, Math.PI * 2, true)
    }
    ctx.closePath()
    ctx.fill()
  }
  next(tile_canvas.toBuffer())
}

Tile.prototype.getGeoJSONBounds = function() {
  var bounds = tileBounds(this.x, this.y, this.z, this.map.tile_size)
  return [[
      [bounds.min[0], bounds.min[1]]
    , [bounds.min[0], bounds.max[1]]
    , [bounds.max[0], bounds.max[1]]
    , [bounds.max[0], bounds.min[1]]
    , [bounds.min[0], bounds.min[1]]
  ]]
}

Tile.prototype.getPixelBounds = function() {
  return {
      min: [this.x * this.map.tile_size, this.y * this.map.tile_size]
    , max: [(this.x + 1) * this.map.tile_size, (this.y + 1) * this.map.tile_size]
  }
}