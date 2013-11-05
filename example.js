// hello, world.

var maptile = require('./index')

var points = [
    { "coordinates" : [  -117.9033811,  33.7237372 ], "type" : "Point" }
  , { "coordinates" : [  -117.9060747,  33.7218313 ], "type" : "Point" }
  , { "coordinates" : [  -117.9034121,  33.722183 ], "type" : "Point" }
  , { "coordinates" : [  -117.9055598,  33.7228303 ], "type" : "Point" }
  , { "coordinates" : [  -117.9023885,  33.7221503 ], "type" : "Point" }
  , { "coordinates" : [  -117.9017614,  33.720981 ], "type" : "Point" }
  , { "coordinates" : [  -117.9051096,  33.7211311 ], "type" : "Point" }
  , { "coordinates" : [  -117.9058423,  33.7241458 ], "type" : "Point" }
  , { "coordinates" : [  -117.9079482,  33.7223639 ], "type" : "Point" }
  , { "coordinates" : [  -117.9175553,  33.723971 ], "type" : "Point" }
  , { "coordinates" : [  -117.9236789,  33.7218576 ], "type" : "Point" }
  , { "coordinates" : [  -117.9227462,  33.7234876 ], "type" : "Point" }
]

var coolMap = new maptile.Map({
  path: __dirname + '/',
  cache: false,
  builder: function(tile, next) {
    //...query here to get points or shapes or something
    tile.drawGeojson(points, {fillStyle: "rgba(165,46,25,0.8)"}, next)
  }
})

// Get a map tile!

var coords = {
    x: 176
  , y: 613
  , z: 10
}
coolMap.getTile(coords, function(err, buffer){
  console.log("this is your png, it also saved somewhere if you have caching", buffer)  
})