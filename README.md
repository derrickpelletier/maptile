Fetching, storing, and generating map tiles for use in Leaflet, Google maps, etc.

`npm install maptile`

## Forthcoming
+ Documentation and tests, like every good module
+ Some clean way to handle cache-life, rather than currently being permanent.
+ Overridable storage and fetch procedures, currently just storing and fetching from relative path. Would be nice to control where these went on a needs basis.
+ Add some kind of buffer method to expand the bounds. For example, a point near the edge of a tile might have a radius that extends beyond the edge of the tile but would not be drawn in the builder for the neighbor tile due to the origin being in the former tile. This would be useful for complex builder operations that aren't simply rendering polys or other queryable shapes onto a map.

------

A couple of the math transforms were repurposed from Leaflet's source: https://github.com/Leaflet/Leaflet

------

Here is some code for using this currently, make sure to check out the example.js file.

```javascript
// Define the maptile object
var coolMap = new maptile({
  path: __dirname + '/../public/tiles/some-map/',
  builder: function(opts, next) {
    var canvas = new Canvas(256, 256)
      , ctx = canvas.getContext('2d')
      , geojson = this.getGeoJSONBounds(opts)

    someKindaQuery.findWithinPoly(geojson, function(err, shapes){
      // ... draw the shapes to the canvas ctx
      next(canvas.toBuffer())
    });
  }
})

// Get a map tile, in an express endpoint for example

var tileEndpoint = function(req, res){
  var coords = {
      x: parseInt(req.params.x)
    , y: parseInt(req.params.y)
    , z: parseInt(req.params.z)
  }

  coolMap.getTile(coords, function(err, buffer){
    res.send(buffer) // png buffer data
  })  
}
```
