import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { SelectionBox } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionHelper.js';
import Delaunator from 'delaunator';

const scene = new THREE.Scene()

//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000 );
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()

renderer.setSize(innerWidth,innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)

document.body.appendChild(renderer.domElement)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, -1, 5)
scene.add(light)

const backLight = new THREE.DirectionalLight(0xffffff, 1)
backLight.position.set(0, 0, -5)
scene.add(backLight)

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );
scene.background = new THREE.Color( 0xffffff );

const size = 20;
const divisions = 20;

const blue = 0x00FFFF
const green = 0x39E51D
const red = 0xE51D2F
const gridHelper = new THREE.GridHelper( size, divisions );
gridHelper.rotation.x=Math.PI/2; //gets grid oriented in XY axis
scene.add( gridHelper );

const material = new THREE.MeshStandardMaterial({color:blue, transparent: true, opacity: 0.5})


var lPnts = [[0,0],[0,5],[3.5,5],[2,2],[5,4.5],[5,0]]

var holePnts = [[0.5,0.5], [1.5,0.5], [1.5,1.5], [0.5,1.5]]
var holesPnts2 = [[1.0,2.5], [0.5,3.0], [1.0,3.5], [1.5,3.0]]
var holesPnts3 = [[2.5,0.5], [3.0,1.0], [3.5,0.5]]




function addHole(holePntsPoly) {
  const holeShape = new THREE.Shape();
  holeShape.currentPoint = holePntsPoly[0]
  for (const [index, pnt] of holePntsPoly.entries()) {
    if (index < lPnts.length-1) {
      var x_values = pnt[0]
      
      var starting = new THREE.Vector2(pnt[0], pnt[1])
      holeShape.currentPoint = starting   
      holeShape.lineTo(holePntsPoly[index][0], holePntsPoly[index][1])
    }
    else {
      var starting = new THREE.Vector2(holePntsPoly[index][0], holePntsPoly[index][1])
      holeShape.currentPoint = starting
      holeShape.lineTo(holePntsPoly[0][0], holePntsPoly[0][1])   
    }
  }
  return holeShape
}

function addConcGeo() {
  const concShape = new THREE.Shape();
  concShape.currentPoint = lPnts[0]
  for (const [index, pnt] of lPnts.entries()) {
    if (index < lPnts.length-1) {
      var x_values = pnt[0]
      
      var starting = new THREE.Vector2(pnt[0], pnt[1])
      concShape.currentPoint = starting   
      concShape.lineTo(lPnts[index][0], lPnts[index][1])
    }
    else {
      var starting = new THREE.Vector2(lPnts[index][0], lPnts[index][1])
      concShape.currentPoint = starting
      concShape.lineTo(lPnts[0][0], lPnts[0][1])   
    }
  }
  var hole = addHole(holePnts)
  var hole2 = addHole(holesPnts2)
  var hole3 = addHole(holesPnts3)
  
  concShape.holes.push(hole)
  concShape.holes.push(hole2)
  concShape.holes.push(hole3)
  //note that segments is just for the outside shape
  const lGeo = new THREE.ShapeGeometry(concShape);
  
  
  const mesh = new THREE.Mesh( lGeo, material ) ;
  scene.add( mesh );
  return [lGeo, concShape]
}

var lGeo = addConcGeo()[0]
var concShape = addConcGeo()[1]

console.log(lGeo)
console.log(concShape)

class Polygon {
  constructor (baseGeo, baseShape) {
    //basepoly is the threejs object
    this.basePoly = baseShape.curves
    //holes is the threejs shape
    this.holes = baseShape.holes
    //basePolyXY is the base geometry polygon, with [x,y] array data structure
    this.basePolyXY = []
    for (let i = 0, len = this.basePoly.length; i < len; i++) {
      this.basePolyXY.push([this.basePoly[i].v1.x, this.basePoly[i].v1.y ]) 
    }
    this.holesPolyXY = []
    this.holePolyXY = []
    // note that "of" loops through the actual object
    //holePolyXy returns [[x,y]..] of all polygon curves
    for (var hole of this.holes) {
      for (let i = 0, len = hole.curves.length; i < len; i++) {
        this.holePolyXY.push([hole.curves[i].v1.x, hole.curves[i].v1.y])
      }
      
      this.holesPolyXY.push(this.holePolyXY)
      this.holePolyXY = []
    }
  }
}


var concPoly = new Polygon(lGeo, concShape)


function ray_casting(point, testPoly, holePolys) {
  var n = testPoly.length;
  var count = 0
  var holeCount = 0
  var x = point[0];
  var y = point[1];
  for(var i=0; i <n; ++i) {
    if (i == n-1) {
      var side = {
        a: {
          x: testPoly[i][0],
          y: testPoly[i][1]
        },
        b: {
          x: testPoly[0][0],
          y: testPoly[0][1]
        }
      }
        var x1 = side.a.x
        var x2 = side.b.x
        var y1 = side.a.y
        var y2 = side.b.y

        if (y < y1 != y < y2 && x < (x2-x1)*(y-y1)/ (y2-y1)+x1) {
        count +=1
      }
    } 
    else {
      var side = {
        a: {
          x: testPoly[i][0],
          y: testPoly[i][1]
        },
        b: {
          x: testPoly[i+1][0],
          y: testPoly[i+1][1]
        }

      }
      var x1 = side.a.x
      var x2 = side.b.x
      var y1 = side.a.y
      var y2 = side.b.y

      if (y < y1 != y < y2 && x < (x2-x1)*(y-y1)/ (y2-y1)+x1) {
        count +=1
      } 
    }
  }
  for (var holePoly of holePolys) {
    var nHole = holePoly.length;
    for(var i=0; i <nHole; ++i) {
      if (i ==nHole-1){
        var side = {
          a: {
            x: holePoly[i][0],
            y: holePoly[i][1]
          },
          b: {
            x: holePoly[0][0],
            y: holePoly[0][1]
          }
  
        }
        var x1 = side.a.x
        var x2 = side.b.x
        var y1 = side.a.y
        var y2 = side.b.y
  
        if (y < y1 != y < y2 && x < (x2-x1)*(y-y1)/ (y2-y1)+x1) {
          holeCount +=1
        }
      }
      else{
        var side = {
          a: {
            x: holePoly[i][0],
            y: holePoly[i][1]
          },
          b: {
            x: holePoly[i+1][0],
            y: holePoly[i+1][1]
          }
  
        }
        var x1 = side.a.x
        var x2 = side.b.x
        var y1 = side.a.y
        var y2 = side.b.y
  
        if (y < y1 != y < y2 && x < (x2-x1)*(y-y1)/ (y2-y1)+x1) {
          holeCount +=1
        }
      }
    } 
  }
  //even number of intercepts is outside of polygon -> false, odd number of intercepts is inside polygon -> true
  // if (count % 2 == 0 && holeCount % 2 == 0 ) {
  //   return holeCount
  // }    
  // else {  
  //   return count
  // }
  //if ((count % 2 == 1 && holeCount % 2 == 1) || count == 0 ) {
  if (count % 2 == 0 || count == 0 ) {
    return [false, count, holeCount]
  }
  else if (holeCount % 2 == 1) {
    return [false, count, holeCount]
  }
  else {
    return [true, count, holeCount]
  }
}





function addPoint (point, true_false) {
  if (true_false[0] == true) {
      var dotGeometry = new THREE.BufferGeometry();
      dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [point[0],point[1],0], 3 ) );
      var dotMaterial = new THREE.PointsMaterial( { size: 0.2, color: green } );
      var dot = new THREE.Points( dotGeometry, dotMaterial );
      scene.add( dot );
  }
  else {
    var dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [point[0],point[1],0], 3 ) );
    var dotMaterial = new THREE.PointsMaterial( { size: 0.2, color: red } );
    var dot = new THREE.Points( dotGeometry, dotMaterial );
    scene.add( dot );
  }
}

function showPoint(point) {
  var dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [point[0],point[1],0], 3 ) );
  var dotMaterial = new THREE.PointsMaterial( { size: 0.2, color: green } );
  var dot = new THREE.Points( dotGeometry, dotMaterial );
  scene.add( dot );
}

function generatePoints() {
  var pnt = [Math.random()*5, Math.random()*5]

  return pnt
}


for (let i = 0; i<100; i++) {
  var pnt = generatePoints()
  addPoint(pnt,ray_casting(pnt,concPoly.basePolyXY ,concPoly.holesPolyXY))
}
var x = generatePoints()
console.log(x)

camera.position.z = 10
const controls = new OrbitControls(camera, renderer.domElement)



function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene,camera)
  //mesh.rotation.x += 0.01
  //mesh.rotation.y += 0.01
}



animate()
