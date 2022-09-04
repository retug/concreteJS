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

const material = new THREE.MeshStandardMaterial({color:blue, transparent: true, opacity: 0.1})

//Base Geometry
var lPnts = [[0,0],[0,20],[3.5,20],[2,2],[5,4.5],[5,0]]
//Hole Geometry
var holePnts = [[0.5,0.5], [1.5,0.5], [1.5,1.5], [0.5,1.5]]
var holesPnts2 = [[1.0,2.5], [0.5,3.0], [1.0,15.5], [1.5,3.0]]
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

lGeo.computeBoundingSphere()
var center = [lGeo.boundingSphere.center.x, lGeo.boundingSphere.center.y] 
var radius = lGeo.boundingSphere.radius



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
  if ((count+holeCount) % 2 == 0  || count == 0 ) {
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

// Generates Points around the bounding sphere of the three js object.
function generateCirclePnts(center, radius, minSize) {
  var nCircles = Math.round(radius/minSize)
  var stepSize = radius/nCircles
  var createdPnts = []
  createdPnts.push[center[0], center[1]]
  for (let i = 0; i < nCircles; i++) {
    var tempRadius = (i+1)*stepSize
    var totalLength= Math.PI * 2 * tempRadius
    var nPoints = Math.round(totalLength/minSize)
    var thetaStep = 2*Math.PI/nPoints
    for (let j = 0; j < nPoints; j++) {
      createdPnts.push([Math.cos(thetaStep*j)*tempRadius+center[0], Math.sin(thetaStep*j)*tempRadius+center[1]])
    }
  }
  return createdPnts
}

//Generate points around boundary and holes
function generateBoundaryPnts(boundary, holes, minSize) {
  var boudaryPnts = []
  for (let i = 0; i < boundary.length; i++) {
    if (i == boundary.length-1) {
      var length = ((boundary[i][1]-boundary[0][1])**2+(boundary[i][0]-boundary[0][0])**2)**0.5
      var nPoints = Math.round(length/minSize)
      var step = length/nPoints
      var vector = [(boundary[i][0]-boundary[0][0])/length, (boundary[i][1]-boundary[0][1])/length]
      for (let j = 0; j < nPoints; j++) {
        var x = boundary[i][0]-vector[0]*j*step
        var y = boundary[i][1]-vector[1]*j*step
        boudaryPnts.push([boundary[i][0]-vector[0]*j*step, boundary[i][1]-vector[1]*j*step])
      }
    }
    else {
      var length = ((boundary[i][1]-boundary[i+1][1])**2+(boundary[i][0]-boundary[i+1][0])**2)**0.5
      var nPoints = Math.round(length/minSize)
      var step = length/nPoints
      var vector = [(boundary[i][0]-boundary[i+1][0])/length, (boundary[i][1]-boundary[i+1][1])/length]
      for (let j = 0; j < nPoints; j++) {
        boudaryPnts.push([boundary[i][0]-vector[0]*j*step, boundary[i][1]-vector[1]*j*step])
      }
    }
  }
  //creates boudnaries around holes
  var holePnts = []
  for (var hole of holes) {
    for (let i = 0; i < hole.length; i++) {
      if (i == hole.length-1) {
        var length = ((hole[i][1]-hole[0][1])**2+(hole[i][0]-hole[0][0])**2)**0.5
        var nPoints = Math.round(length/minSize)
        var step = length/nPoints
        var vector = [(hole[i][0]-hole[0][0])/length, (hole[i][1]-hole[0][1])/length]
        for (let j = 0; j < nPoints; j++) {
          var x = hole[i][0]-vector[0]*j*step
          var y = hole[i][1]-vector[1]*j*step
          holePnts.push([hole[i][0]-vector[0]*j*step, hole[i][1]-vector[1]*j*step])
        }
      }
      else {
        var length = ((hole[i][1]-hole[i+1][1])**2+(hole[i][0]-hole[i+1][0])**2)**0.5
        var nPoints = Math.round(length/minSize)
        var step = length/nPoints
        var vector = [(hole[i][0]-hole[i+1][0])/length, (hole[i][1]-hole[i+1][1])/length]
        for (let j = 0; j < nPoints; j++) {
          holePnts.push([hole[i][0]-vector[0]*j*step, hole[i][1]-vector[1]*j*step])
        }
      }
    }
  }
  return [boudaryPnts, holePnts]
}

var boundaryPnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 0.5)[0]
var holePnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 0.5)[1]
var circlePnts = generateCirclePnts(center,radius,0.5)



var i = 0
var generatedPnts = []
for (var circlePnt of circlePnts) {
  var TF = ray_casting(circlePnt,concPoly.basePolyXY ,concPoly.holesPolyXY)
  
  
  if (TF[0] == true) {

    generatedPnts.push(circlePnt)
    console.log(i)
  }
  console.log(TF)
}

console.log(generatedPnts)

var x = ray_casting(circlePnts[4],concPoly.basePolyXY ,concPoly.holesPolyXY)

//generates all of the points to feed into dealunotr function
function geneterateDelauntor(boundaryPnts, holePnts, generatedPnts) {
  var combinedPnts = boundaryPnts.concat( holePnts, generatedPnts)
  XYlist = []
  for (var combinedPnt of combinedPnts) {
    XYlist.push([combinedPnt[0], combinedPnt[1]])
  }
  return XYlist
}

var XYlist = geneterateDelauntor(boundaryPnts, holePnts, generatedPnts)
var delaunay = Delaunator.from(XYlist);


function drawTriangles (triangles, XYlist) {
  var positionTri = []
  for (let i = 0; i < triangles.length; i += 3) {
    positionTri.push([
      XYlist[triangles[i]],
      XYlist[triangles[i + 1]],
      XYlist[triangles[i + 2]]
      ]);
  }
  return positionTri
}
//note order matters!!!, had to go 2, 1, 0
function drawTrianglesThree (positionTri) {
  for (let i = 0; i < positionTri.length-1; i++) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array (
      [positionTri[i][2][0], positionTri[i][2][1], 0,
      positionTri[i][1][0], positionTri[i][1][1], 0,
      positionTri[i][0][0], positionTri[i][0][1], 0,
    ]
    )
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    const material = new THREE.MeshStandardMaterial( { color: red, wireframe: true } );
    const mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh)
    }
   }

var triangleXY = drawTriangles(delaunay.triangles, XYlist) 
drawTrianglesThree(triangleXY)




//Plots the generated circle points, green in, red out
for (var circlePnt of circlePnts) {
 addPoint(circlePnt,ray_casting(circlePnt,concPoly.basePolyXY ,concPoly.holesPolyXY))
}

//Plots the generated boundary points, green in, red out
for (var boundaryPnt of boundaryPnts) {
  addPoint(boundaryPnt,ray_casting(boundaryPnt,concPoly.basePolyXY ,concPoly.holesPolyXY))
}

//Plots the generated hole points, green in, red out
for (var holePnt of holePnts) {
  addPoint(holePnt,ray_casting(holePnt,concPoly.basePolyXY ,concPoly.holesPolyXY))
}



camera.position.z = 10
const controls = new OrbitControls(camera, renderer.domElement)


function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene,camera)
}
animate()
