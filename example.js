// hello, world.

var maptile = require('./index')

var points = [
    { "coordinates" : [  -118.0097634,  34.5762245 ], "type" : "Point" }
  , { "coordinates" : [  -118.0184048,  34.57504 ], "type" : "Point" }
  , { "coordinates" : [  -118.0157943,  34.5772466 ], "type" : "Point" }
  , { "coordinates" : [  -118.0169737,  34.5749981 ], "type" : "Point" }
  , { "coordinates" : [  -118.0163243,  34.5788158 ], "type" : "Point" }
  , { "coordinates" : [  -118.0239772,  34.576114 ], "type" : "Point" }
  , { "coordinates" : [  -118.0194372,  34.5740084 ], "type" : "Point" }
  , { "coordinates" : [  -118.0199431,  34.5767789 ], "type" : "Point" }
  , { "coordinates" : [  -118.0194502,  34.5754087 ], "type" : "Point" }
  , { "coordinates" : [  -118.0284972,  34.5762863 ], "type" : "Point" }
]

var coolMap = new maptile({
  path: __dirname + '/',
  builder: function(tile, next) {
    //...query here to get points or shapes or something
    tile.drawGeojson(points, {fillStyle: "rgba(165,46,25,0.8)"}, next)
  }
})

// Get a map tile!

var coords = {
    x: 176
  , y: 616
  , z: 10
}
coolMap.getTile(coords, function(err, buffer){
  console.log("this is your png, it also saved somewhere if you have caching", buffer)  
})

