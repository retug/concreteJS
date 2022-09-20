import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { SelectionBox } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionHelper.js';
import Delaunator from 'delaunator';
import Plotly from 'plotly.js-dist'

const scene = new THREE.Scene()

//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000 );
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({antialias: true})

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
var lPnts = [[0,0],[10,0],[10,10],[0,10]]
//Hole Geometry
var holePnts = [[4.5,4.5], [5.5,4.5], [5.5,5.5], [4.5,5.5]]
//var holesPnts2 = [[1.0,2.5], [0.5,3.0], [1.0,15.5], [1.5,3.0]]
//var holesPnts3 = [[2.5,0.5], [3.0,1.0], [3.5,0.5]]


var rebarPnts = [[2,2], [2,8]]
//var rebarPnts = []

//circle for the rebar
const sprite = new THREE.TextureLoader().load( 'disc.png' );

var rebarDia = {
  3: 0.375,
  4: 0.5,
  5: 0.625,
  6: 0.75,
  7: 0.875,
  8: 1.0,
  9: 1.128,
  10: 1.27,
  11: 1.41,
  14: 1.693,
  18: 2.257
}


//add a new material for each point
function addRebar(rebarPnts) {
  var X1 = rebarPnts[0]
  var Y1 = rebarPnts[1]
  var barDia = 7
  var tempDotGeo = new THREE.BufferGeometry();
  tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [X1,Y1,0], 3 ) );
  var selectedDotMaterial = new THREE.PointsMaterial( { size: rebarDia[barDia], sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true  } );
  selectedDotMaterial.color.setHSL( 0.0, 0.0, 0.5 );
  var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
  tempDot.isRebar = true
  tempDot.rebarSize = barDia
  scene.add( tempDot );
  console.log(tempDot)
  return tempDot
}

var sceneRebar = []
for (var rebar of rebarPnts) {
  sceneRebar.push(addRebar(rebar))
}

console.log(sceneRebar)

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
  //var hole2 = addHole(holesPnts2)
  //var hole3 = addHole(holesPnts3)
  
  concShape.holes.push(hole)
  //concShape.holes.push(hole2)
  //concShape.holes.push(hole3)
  //note that segments is just for the outside shape
  const lGeo = new THREE.ShapeGeometry(concShape);
  
  
  const mesh = new THREE.Mesh( lGeo, material ) ;
  scene.add( mesh );
  console.log('your shpae is here')
  console.log(lGeo)
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

var boundaryPnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 2.0)[0]
var holePnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 2.0)[1]
var circlePnts = generateCirclePnts(center,radius, 2.0)



var i = 0
var generatedPnts = []
for (var circlePnt of circlePnts) {
  var TF = ray_casting(circlePnt,concPoly.basePolyXY ,concPoly.holesPolyXY)
  if (TF[0] == true) {
    generatedPnts.push(circlePnt)
  }
}


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
  var concElements = []
  var concCentriodX = 0
  var concCentriodY = 0
  var area = 0
  for (let i = 0; i < positionTri.length; i++) {
    var geometry = new THREE.BufferGeometry();
    var x1 = positionTri[i][2][0]
    var y1 = positionTri[i][2][1]
    var x2 = positionTri[i][1][0]
    var y2 = positionTri[i][1][1]
    var x3 = positionTri[i][0][0]
    var y3 = positionTri[i][0][1]
    var vertices = new Float32Array (
      [x1, y1, 0,
      x2, y2, 0,
      x3, y3, 0,
    ]
    )
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    
    const material = new THREE.MeshStandardMaterial( { color: red, wireframe: true } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.area = Math.abs((x1*y2+x2*y3+x3*y1-y1*x2-y2*x3-y3*x1)/2)
    mesh.centriod = {x : (x1+x2+x3)/3,
                     y: (y1+y2+y3)/3}
    //if the centeriod of the triangle is not in the main polygon, remove it from the shape
    var test = ray_casting([mesh.centriod.x, mesh.centriod.y], concPoly.basePolyXY ,concPoly.holesPolyXY)
    // console.log('area is')
    // console.log(mesh.area)
    // console.log('centriod is')
    // console.log(mesh.centriod)

    
    if (test[0] == true) {
      scene.add(mesh)

      concElements.push(mesh)
      area += mesh.area 
      concCentriodX += mesh.area * mesh.centriod.x
      //this was updated
      concCentriodY += mesh.area * mesh.centriod.y
    }

  }
  return [concElements, [concCentriodX/area,concCentriodY/area]]
}

var triangleXY = drawTriangles(delaunay.triangles, XYlist) 
var concElements = drawTrianglesThree(triangleXY)
var concCentriod =  concElements[1]


console.log('your centriod is')
console.log(concCentriod)




//var concStressStrain = [[-0.01,-0.01], [-0.003,-4], [-0.002, -4], [0,0]]

var concStressStrain = [[-0.01,-0.01], [-0.01,-4], [-0.002, -4], [0,0]]

//this is super plastic rebar
var steelStressStrain = [[0,0], [0.00207, 60], [1, 60], [1.1, 0.01]]
//this is more relastic rebar
//var steelStressStrain = [[0,0], [0.00207, 60], [0.05, 60], [0.09, 0.01]]


//  MATERIAL DEFINTION LOCATIONS //
class ConcMat {
  constructor (stressStrain, conc, DU) {
    this.stressStrain = stressStrain
    this.conc = conc
    this.DU = DU //point where concrete starts to crush
  }
  //generates the stress strain function, this may not be super effecient
    stress(strain) {
      if (strain < this.stressStrain[0][0]) {
        return 0;
      }
      else if (strain > this.stressStrain[this.stressStrain.length-1][0]) {
        return 0
      }
      else {
        for (let i = 0; i < this.stressStrain.length-1; i++) {
          if (strain >= this.stressStrain[i][0] && strain <= this.stressStrain[i+1][0]) {
            return (this.stressStrain[i][1] + ((strain-this.stressStrain[i][0])*(this.stressStrain[i+1][1]-this.stressStrain[i][1])/(this.stressStrain[i+1][0]-this.stressStrain[i][0])))
          }
        }
      }
    }
}

var concMaterial = new ConcMat(concStressStrain, true, -0.003)

class SteelMat {
  constructor (stressStrain, conc, DU) {
    this.stressStrain = stressStrain
    this.conc = conc
    this.DU = DU //point where steel loses strength
  }
  //generates the stress strain function of a symetric stress strain curve, ie steel
  steelCurve(strain) {
    if (Math.abs(strain) < this.stressStrain[0][0]) {
      return 0;
    }
    else if (Math.abs(strain) > this.stressStrain[this.stressStrain.length-1][0]) {
      return 0
    }
    else {
      for (let i = 0; i < this.stressStrain.length-1; i++) {
        if (Math.abs(strain) >= this.stressStrain[i][0] && Math.abs(strain) <= this.stressStrain[i+1][0]) {
          return (this.stressStrain[i][1] + ((Math.abs(strain)-this.stressStrain[i][0])*(this.stressStrain[i+1][1]-this.stressStrain[i][1])/(this.stressStrain[i+1][0]-this.stressStrain[i][0])))
        }
      }
    }
  }
  stress(strain) {
    if (strain < 0) {
      return -this.steelCurve(strain)
    }
    else {
      return this.steelCurve(strain)
    }
  }
}


var steelMaterial = new SteelMat(steelStressStrain, true, 0.05)

// END MATERIAL DEFINITION



//Generate Strain Profiles for the PM Analysis
function generateStrains(concShape, rebarShapes,steps) {
  var rebarLocations = []
  var pointLocations = []
  
  for (var steelRebar of rebarShapes) {
    rebarLocations.push(steelRebar.geometry.attributes.position.array[1])
  }
  //... is the spread operator in JS

  for (var pnt of concShape) {
    pointLocations.push(pnt[1])
  }
  //find the max Y position of rebar and concrete
  var rebarMax = Math.max(...rebarLocations)
  var rebarMin = Math.min(...rebarLocations)
  var concMax = Math.max(...pointLocations)
  var concMin = Math.min(...pointLocations)
  console.log("concMax")
  console.log(concMax)
  console.log("concMin")
  console.log(concMin)
  
  
  console.log('rebar Max')
  console.log(rebarMax)
  console.log('rebar min')
  console.log(rebarMin)



  //generate an array of functions for the the PM diagram to loop over
  //from pure  compression to tension failure
  var strainProfileCtoT = []
  var slopeStep = ((0.025-(-0.003))/(concMax-rebarMin))/(steps-1)

  //from tension failure on one side to pure tension
  var strainProfileTtoT = []
  var slopeStepTtoT = ((-0.003-(0.025))/(rebarMin-concMax))/(steps-1)

  //from pure tension back to compression failure
  var strainProfileTtoC = []
  var slopeStepTtoC = -((-0.003-(0.025))/(rebarMax-concMin))/(steps-1)

  //from pure compression failure to compression failure
  var strainProfileCtoC = []
  var slopeStepCtoC = -((-0.003-(0.025))/(concMin-rebarMax))/(steps-1)

  for (let i =0; i <= steps-1; i++) {
    //first value is m, next is b
    strainProfileCtoT.push([i*slopeStep, -0.003-(i*slopeStep)*(-concMax)])
    //first value is m, next is b
    strainProfileTtoT.push([slopeStepTtoT*(steps-1-i), 0.025-slopeStepTtoT*(steps-1-i)*-rebarMin])
    //first value is m, next is b
    strainProfileTtoC.push([-slopeStepTtoC*i, 0.025-(i*slopeStepTtoC)*(-concMin)])
    //first value is m, next is b
    strainProfileCtoC.push([(steps-1-i)*slopeStepCtoC, (-0.003-slopeStepCtoC*-(steps-1-i)*-rebarMax)])
  }
  //var strainProfile = strainProfileCtoT.concat(strainProfileTtoT, strainProfileTtoC, strainProfileCtoC)
  var strainProfile = strainProfileCtoT.concat(strainProfileTtoT)

  console.log(strainProfile)
  return strainProfile
}

//lPnts is the base concrete shape, [[x,y ],[x1,y1]]
var slopes = generateStrains(lPnts, sceneRebar,100)
console.log(slopes)

//this should be called strain function
function strainFunction(m, x, b) {
  return m*x+b
}

// GENERATE PM DIAPGRAM, [1,0] is typical bending about X axis
function generatePM(vector, concElements, rebarShapes, strainProfiles, concCentriod) {
  var pureCompression = -0.003
  let concForce2 = 0
  let concArea2 = 0
  var concMoment2 = 0
  var steelForce2 = 0
  var steelMoment2 = 0

  for (var concEle of concElements) {
    
    concForce2 += concMaterial.stress(pureCompression)*concEle.area
    concArea2 += concEle.area
    concMoment2 += concMaterial.stress(pureCompression)*concEle.area*(concEle.centriod.y-concCentriod[1])
    
  }

  for (var steelRebar of rebarShapes) {
    //area times stress(strain)
    steelForce2 += Math.PI/4*rebarDia[steelRebar.rebarSize]**2*steelMaterial.stress(pureCompression)
    steelMoment2 += Math.PI/4*rebarDia[steelRebar.rebarSize]**2*steelMaterial.stress(pureCompression)*(steelRebar.geometry.attributes.position.array[1]-concCentriod[1])
    console.log(steelForce2)
  }
  console.log("total concrete force =")
  console.log(concForce2)
  console.log("concrete area")
  console.log(concArea2)
  console.log('steel force')
  console.log(steelForce2)

  console.log('conc moment')
  console.log(concMoment2)
  console.log('steel moment')
  console.log(steelMoment2)
  

  var values = []
  let totalForceArray = []
  let totalMomentArray = []

  //looping through each stress strain profile
  for (var strainProfile of strainProfiles) {
    let concForce = 0
    var steelForce = 0
    var concMoment = 0
    var steelMoment = 0
    for (var concEle of concElements) {
      concForce += concMaterial.stress(strainFunction(strainProfile[0],concEle.centriod.y, strainProfile[1]))*concEle.area
      //concMoment += -concMaterial.stress(strainFunction(strainProfile[0],concEle.centriod.y, strainProfile[1]))*(concEle.area*concEle.centriod.y-strainProfile[1])
      //concMoment += -concMaterial.stress(strainFunction(strainProfile[0],concEle.centriod.y, strainProfile[1]))*(concEle.area)*(concEle.centriod.y-concCentriod[1])
      concMoment += -concMaterial.stress(strainFunction(strainProfile[0],concEle.centriod.y, strainProfile[1]))*(concEle.area)*(concEle.centriod.y-strainProfile[1])

    }
  
    for (var steelRebar of rebarShapes) {
      //area times stress(strain)
      // this has been updated
      steelForce += Math.PI/4*(rebarDia[steelRebar.rebarSize])**2*steelMaterial.stress(strainFunction(strainProfile[0],steelRebar.geometry.attributes.position.array[1], strainProfile[1]))

      steelMoment += -Math.PI/4*(rebarDia[steelRebar.rebarSize])**2*steelMaterial.stress(strainFunction(strainProfile[0],steelRebar.geometry.attributes.position.array[1], strainProfile[1]))*(steelRebar.geometry.attributes.position.array[1]-strainProfile[1])

      
    }
    totalForceArray.push(steelForce+concForce)
    totalMomentArray.push(steelMoment+concMoment)
    
  }
  // console.log("your total force is")
  // console.log(totalForceArray)
  // console.log("your total moment is")
  // console.log(totalMomentArray)
  return [totalForceArray, totalMomentArray]
}

var momentDia = generatePM([1,0], concElements[0], sceneRebar, slopes, concCentriod)
console.log(momentDia)
var trace1 = {
  x: momentDia[1],
  y: momentDia[0],
  mode: 'lines+markers'
};

var layout = {
  xaxis: {
    title: {
      text: 'Moment (+ tension in bottom)',
      font: {
      }
    },
  },
  yaxis: {
    title: {
      text: 'Axial Load (-compression)',
      font: {
      }
    }
  }
};


var data = [trace1];

const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})
//Plotly.newPlot('myDiv', data);

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  Plotly.newPlot('plot', data, layout);
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}

camera.position.z = 10
const controls = new OrbitControls(camera, renderer.domElement)


function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene,camera)
}
animate()
