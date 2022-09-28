import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { SelectionBox } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'https://unpkg.com/three@0.126.1/examples/jsm/interactive/SelectionHelper.js';
import Delaunator from 'delaunator';
import Plotly from 'plotly.js-dist'

const concGui = document.querySelector('#concGui');

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, concGui.offsetWidth/concGui.offsetHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector('canvas')
})

scene.background = new THREE.Color( 0xffffff );

renderer.setSize(concGui.offsetWidth, concGui.offsetHeight)
renderer.setPixelRatio(window.devicePixelRatio)

//////////this the region of the dot///////////////
var dotGeometry = new THREE.BufferGeometry();
dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0], 3 ) );
var dotMaterial = new THREE.PointsMaterial( { size: 0.5, color: 0x000000 } );

var dot = new THREE.Points( dotGeometry, dotMaterial );

dot.isReference = true
scene.add( dot );
/////////////////////////////end dot///////////////

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, -1, 5)
scene.add(light)

const backLight = new THREE.DirectionalLight(0xffffff, 1)
backLight.position.set(0, 0, -5)
scene.add(backLight)

const controls = new OrbitControls(camera, renderer.domElement)
controls.mouseButtons = {MIDDLE: THREE.MOUSE.PAN}
controls.enableRotate = false;
//controls.enablePan = false;

camera.position.z = 50

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

const size = 20;
const divisions = 20;

const gridHelper = new THREE.GridHelper( size, divisions );
gridHelper.rotation.x=Math.PI/2; //gets grid oriented in XY axis
scene.add( gridHelper );

renderer.render( scene, camera );

const selectionBox = new SelectionBox( camera, scene );
// const helper = new SelectionHelper(renderer, 'selectBox' );
let helper = new SelectionHelper( camera ,renderer, 'selectBox' );
console.log(helper)
//beginning comand 
//#1
var allSelectedPnts = []
var allSelectedRebar = []
var allSelectedConc = []
//#1


//middle mouse variable tests for panning
let middlemouse = 0

document.getElementById('concGui').addEventListener( 'pointerdown', function ( event ) {
  console.log(event.button)
  if (event.button == 1) {
    middlemouse = 1
    let selectImage = document.querySelectorAll(".selectBox");
    console.log(selectImage[0])
    if (selectImage[0] != null) {
      selectImage[0].classList.remove('selectBox')
      selectImage[0].classList.add('selectBoxInvis')
    }
  }
  else {
    let selectImage = document.querySelectorAll(".selectBoxInvis");
    console.log(selectImage[0])
    if (selectImage[0] != null) {
      selectImage[0].classList.add('selectBox')
      selectImage[0].classList.remove('selectBoxInvis')
    }


    if (event.ctrlKey) {
      selectionBox.startPoint.set(
        ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
        - ( event.clientY / concGui.offsetHeight )*2+1,
        0.5 );
    }
    else {
      //reset the selected nodes
      console.log("something else pressed")
      // reset the color of all points when control is not held down
      for ( const pnt of allSelectedPnts ) {
        pnt.material.color.set( 0x00FF00 );
      }
      //resets the color of the rebar
      for (const pnt of allSelectedRebar) {
        pnt.material.color.setHSL( 0.0, 0.0, 0.5 );
      }
      for (const pnt of allSelectedConc) {
        pnt.material.color.set(0xE5E5E5);
      }
      allSelectedPnts = []
      allSelectedRebar = []
      allSelectedConc = []
      //reset the selected points array
      selectionBox.startPoint.set(
        ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
        - ( event.clientY / concGui.offsetHeight )*2+1,
        0.5 );
    }
  }
  
} );


//while mouse is moving
//#2
document.getElementById('concGui').addEventListener( 'pointermove', function ( event ) {
  if (middlemouse != 1) {
    if (event.ctrlKey) {
      if ( helper.isDown ) {
        selectionBox.endPoint.set(
          ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
          - ( event.clientY / concGui.offsetHeight )*2+1,
          0.5 );
      }
      const allSelected = selectionBox.select()
      //this is the color for when you are mouse dragging  
      for ( let i = 0; i < allSelected.length; i ++ ) {
        //Points
        if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar != true) {
        //selected point is 0xFF7F00
          allSelected[ i ].material.color.set( 0xFF7F00);        
        }
        //Rebar
        else if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar == true) {
          //selected point is 0xFF7F00
            allSelected[ i ].material.color.set( 0xFF7F00);        
          }
          else if (allSelected[ i ].constructor.name == "Mesh") {
            allSelected[ i ].material.color.set( 0xFF7F00);
          }
      }
    }
    else {
      if ( helper.isDown ) {
        selectionBox.endPoint.set(
          ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
          - ( event.clientY / concGui.offsetHeight )*2+1,
          0.5 );
        
        const allSelected = selectionBox.select();
        //this is the color for when you are mouse dragging  
        for ( let i = 0; i < allSelected.length; i ++ ) {
          //points
          if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar != true) {
            //selected point is 0xFF7F00
            allSelected[ i ].material.color.set( 0xFF7F00);        
          }
          //rebar
          else if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar == true) {
            //selected point is 0xFF7F00
            allSelected[ i ].material.color.set( 0xFF7F00);        
          }
          else if (allSelected[ i ].constructor.name == "Mesh") {
            allSelected[ i ].material.color.set( 0xFF7F00);
          }
  
        }
      }
    }
  }
} );   



//when you unselect the left mouse
//#3

document.getElementById('concGui').addEventListener( 'pointerup', function ( event ) {
// we are adding points to the previously constructed list
if (middlemouse != 1) {
  if (event.ctrlKey) {
    selectionBox.endPoint.set(
      ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
      - ( event.clientY / concGui.offsetHeight)*2+1,
      0.5 );
    const allSelected = selectionBox.select();
    for ( let i = 0; i < allSelected.length; i ++ ) {
      // filtering for points selected
      if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar != true ) {
        allSelectedPnts.push(allSelected[i])
        //selected point is 0xFF7F00
        allSelected[ i ].material.color.set( 0xFF7F00);
  
        //adding to table
        let table = document.getElementById("pointData")
        let row = document.createElement('tr');
        let Xpnt = allSelected[ i ].geometry.attributes.position.array[0] 
        let Ypnt = allSelected[ i ].geometry.attributes.position.array[1]
        let Xdata = document.createElement('td')
        let Ydata = document.createElement('td')
        var Xinput = document.createElement("input");
        var Yinput = document.createElement("input");
        Xinput.type = "Number";
        Yinput.type = "Number";
        Xinput.value = Xpnt
        Yinput.value = Ypnt
        Xinput.classList.add("numDropDown")
        Yinput.classList.add("numDropDown")
        Xdata.appendChild(Xinput) 
        Ydata.appendChild(Yinput)
        row.appendChild(Xdata)
        row.appendChild(Ydata)
        table.appendChild(row)  
      }
      // filtering for rebar selected
      else if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar == true ) {
  
        allSelectedRebar.push(allSelected[i])
        allSelected[ i ].material.color.set( 0xFF7F00);
        let table = document.getElementById("rebarData")
        let row = document.createElement('tr');
        let Xpnt = allSelected[ i ].geometry.attributes.position.array[0] 
        let Ypnt = allSelected[ i ].geometry.attributes.position.array[1]
        let barDiaSelected = allSelected[ i ].rebarSize
        let Xdata = document.createElement('td')
        let Ydata = document.createElement('td')
        let barData = document.createElement('td')
        var Xinput = document.createElement("input");
        var Yinput = document.createElement("input");
        //var barDiaInput = document.createElement("input");
        var barDiaInput = document.createElement("select");
  
        var array = [3,4,5,6,7,8,9,10,11,14,18]
  
        for (var j = 0; j < array.length; j++) {
          var option = document.createElement("option");
          option.setAttribute("value", array[j]);
          option.text = array[j];
          barDiaInput.appendChild(option);
        }
  
        Xinput.type = "Number";
        Yinput.type = "Number";
        //barDiaInput.type = "Number";
        Xinput.value = Xpnt
        Yinput.value = Ypnt
        barDiaInput.value = barDiaSelected
        Xinput.classList.add("numDropDown") 
        Yinput.classList.add("numDropDown")
        barDiaInput.classList.add("numDropDown")
        Xdata.appendChild(Xinput) 
        Ydata.appendChild(Yinput)
        barData.appendChild(barDiaInput)
        row.appendChild(Xdata)
        row.appendChild(Ydata)
        row.appendChild(barData)
        table.appendChild(row)  
      }
      else if (allSelected[ i ].constructor.name == "Mesh") {
        allSelectedConc.push(allSelected[i])
        allSelected[ i ].material.color.set( 0xFF7F00);
        //adding to table
        let table = document.getElementById("concData")
        let row = document.createElement('tr');
        let concPnt = allSelectedConc.length
  
        
        let concData = document.createElement('td')
        concData.innerHTML = concPnt
        row.appendChild(concData)
  
        table.appendChild(row)  
      }
  
    }
    var pnts = document.getElementById("pointsSelected")
  
    pnts.innerHTML = (allSelectedPnts.length) 
    var rebars = document.getElementById("rebarSelected")
    rebars.innerHTML = allSelectedRebar.length
    var concs = document.getElementById("concSelected")
    concs.innerHTML = allSelectedConc.length
  }
    else {
      //resets the points in the scene
      let temptable = document.getElementById("pointData")
      temptable.innerHTML = ''
      let rebartable = document.getElementById("rebarData")
      rebartable.innerHTML = ''
      let conctable = document.getElementById("concData")
      conctable.innerHTML = ''
      //end reset
      selectionBox.endPoint.set(
        ((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1,
        - ( event.clientY / concGui.offsetHeight)*2+1,
        0.5 );
  
      const allSelected = selectionBox.select();
  
      for ( let i = 0; i < allSelected.length; i ++ ) {
        // filtering for points selected
        if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar != true) {
          allSelectedPnts.push(allSelected[i])
          //selected point is 0xFF7F00
          allSelected[ i ].material.color.set( 0xFF7F00);
          
        }
        //this is rebar
        else if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar == true) {
          allSelectedRebar.push(allSelected[i])
          //selected point is 0xFF7F00
          allSelected[ i ].material.color.set( 0xFF7F00);
          
        }
        else if (allSelected[ i ].constructor.name == "Mesh") {
          allSelectedConc.push(allSelected[i])
          allSelected[ i ].material.color.set( 0xFF7F00);
          
        }
  
      }
      //adding to table for Points
      allSelectedPnts = [] //added
      allSelectedRebar = []
      allSelectedConc = [] //added
      for ( let i = 0; i < allSelected.length; i ++ ) {
            // filtering for points selected
        if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar != true ) {
          allSelectedPnts.push(allSelected[i])
          //selected point is 0xFF7F00
          allSelected[ i ].material.color.set( 0xFF7F00);
  
          let table = document.getElementById("pointData")
          let row = document.createElement('tr');
          let Xpnt = allSelected[ i ].geometry.attributes.position.array[0] 
          let Ypnt = allSelected[ i ].geometry.attributes.position.array[1]
          let Xdata = document.createElement('td')
          let Ydata = document.createElement('td')
          var Xinput = document.createElement("input");
          var Yinput = document.createElement("input");
          Xinput.type = "Number";
          Yinput.type = "Number";
          Xinput.value = Xpnt
          Yinput.value = Ypnt
          Xdata.appendChild(Xinput) 
          Ydata.appendChild(Yinput)
          row.appendChild(Xdata)
          row.appendChild(Ydata)
          Xinput.classList.add("numDropDown") 
          Yinput.classList.add("numDropDown")
          table.appendChild(row)  
        }
        // filtering for rebar selected
        else if (allSelected[ i ].constructor.name == "Points" && allSelected[i].isReference != true && allSelected[i].isRebar == true ) {
  
          allSelectedRebar.push(allSelected[i])
          allSelected[ i ].material.color.set( 0xFF7F00);
          let table = document.getElementById("rebarData")
  
          let row = document.createElement('tr');
          let Xpnt = allSelected[ i ].geometry.attributes.position.array[0] 
          let Ypnt = allSelected[ i ].geometry.attributes.position.array[1]
          let barDiaSelected = allSelected[ i ].rebarSize
          let Xdata = document.createElement('td')
          let Ydata = document.createElement('td')
          let barData = document.createElement('td')
          var Xinput = document.createElement("input");
          var Yinput = document.createElement("input");
          var barDiaInput = document.createElement("select");
  
          var array = [3,4,5,6,7,8,9,10,11,14,18]
  
          for (var j = 0; j < array.length; j++) {
            var option = document.createElement("option");
            option.setAttribute("value", array[j]);
            option.text = array[j];
            barDiaInput.appendChild(option);
          }
  
          Xinput.type = "Number";
          Yinput.type = "Number";
          //barDiaInput.type = "Number";
          Xinput.value = Xpnt
          Yinput.value = Ypnt
          barDiaInput.value = barDiaSelected
          Xinput.classList.add("numDropDown") 
          Yinput.classList.add("numDropDown")
          barDiaInput.classList.add("numDropDown")
          Xdata.appendChild(Xinput) 
          Ydata.appendChild(Yinput)
          barData.appendChild(barDiaInput)
          row.appendChild(Xdata)
          row.appendChild(Ydata)
          row.appendChild(barData)
          table.appendChild(row)  
        }
        else if (allSelected[ i ].constructor.name == "Mesh") {
            allSelectedConc.push(allSelected[i])
            allSelected[ i ].material.color.set( 0xFF7F00);
            //adding to table
            let table = document.getElementById("concData")
            let row = document.createElement('tr');
            let concPnt = allSelectedConc.length
  
            
            let concData = document.createElement('td')
            concData.innerHTML = concPnt
            row.appendChild(concData)
  
            table.appendChild(row)  
        }
      }
    }
}

  var pnts = document.getElementById("pointsSelected")

  pnts.innerHTML = (allSelectedPnts.length) 
  var rebars = document.getElementById("rebarSelected")
  rebars.innerHTML = allSelectedRebar.length
  var concs = document.getElementById("concSelected")
  concs.innerHTML = allSelectedConc.length
  middlemouse = 0
} );    
//making Concrete Shape
function addConcGeo() {
  const concShape = new THREE.Shape();
  concShape.currentPoint = allSelectedPnts[0]
  for (const [index, pnt] of allSelectedPnts.entries()) {
    if (index < allSelectedPnts.length-1) {
      var x_values = pnt.geometry.attributes.position.array[0]

      
      var starting = new THREE.Vector2(pnt.geometry.attributes.position.array[0], pnt.geometry.attributes.position.array[1])

      concShape.currentPoint = starting   
      concShape.lineTo(allSelectedPnts[index].geometry.attributes.position.array[0], allSelectedPnts[index].geometry.attributes.position.array[1])
    }
    else {
      var starting = new THREE.Vector2(allSelectedPnts[index].geometry.attributes.position.array[0], allSelectedPnts[index].geometry.attributes.position.array[1])
      concShape.currentPoint = starting
      concShape.lineTo(allSelectedPnts[0].geometry.attributes.position.array[0], allSelectedPnts[0].geometry.attributes.position.array[1])   
    }
  }
  const geometry = new THREE.ShapeGeometry( concShape );
  const material = new THREE.MeshStandardMaterial( {color: 0xE5E5E5, transparent: true,
    opacity: 0.4 } );
  const mesh = new THREE.Mesh( geometry, material ) ;
  scene.add( mesh );
}

  
//function generates that generates the hole in the concrete shape
function addHole() {
  const holeShape = new THREE.Shape();
  holeShape.currentPoint = allSelectedPnts[0]
  for (const [index, pnt] of allSelectedPnts.entries()) {
    if (index < allSelectedPnts.length-1) {
      var x_values = pnt[0]
      
      var starting = new THREE.Vector2(pnt.geometry.attributes.position.array[0], pnt.geometry.attributes.position.array[1])
      holeShape.currentPoint = starting   
      holeShape.lineTo(allSelectedPnts[index].geometry.attributes.position.array[0], allSelectedPnts[index].geometry.attributes.position.array[1])
    }
    else {
      var starting = new THREE.Vector2(allSelectedPnts[index].geometry.attributes.position.array[0], allSelectedPnts[index].geometry.attributes.position.array[1])
      holeShape.currentPoint = starting
      holeShape.lineTo(allSelectedPnts[0].geometry.attributes.position.array[0], allSelectedPnts[0].geometry.attributes.position.array[1])   
    }
  }
  scene.remove(allSelectedConc[0])
  allSelectedConc[0].geometry.parameters.shapes.holes.push(holeShape)

  const concShape = new THREE.Shape();
  concShape.holes.push(holeShape)
  const material = new THREE.MeshStandardMaterial( {color: 0xE5E5E5, transparent: true,
    opacity: 0.4 } );
  const lGeo = new THREE.ShapeGeometry(allSelectedConc[0].geometry.parameters.shapes);
  const mesh = new THREE.Mesh( lGeo, material ) ;
  console.log(allSelectedConc[0])
  scene.add(mesh)

}

class Polygon {
  constructor (baseShape) {
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

//generates all of the points to feed into dealunotr function
function geneterateDelauntor(boundaryPnts, holePnts, generatedPnts) {
  var combinedPnts = boundaryPnts.concat( holePnts, generatedPnts)
  var XYlist = []
  for (var combinedPnt of combinedPnts) {
    XYlist.push([combinedPnt[0], combinedPnt[1]])
  }
  return XYlist
}

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
function drawTrianglesThree (positionTri, concPoly) {
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

    
    const material = new THREE.MeshStandardMaterial( { wireframe: true } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.area = Math.abs((x1*y2+x2*y3+x3*y1-y1*x2-y2*x3-y3*x1)/2)
    mesh.centriod = {x : (x1+x2+x3)/3,
                     y: (y1+y2+y3)/3}
    //if the centeriod of the triangle is not in the main polygon, remove it from the shape
    var test = ray_casting([mesh.centriod.x, mesh.centriod.y], concPoly.basePolyXY ,concPoly.holesPolyXY)
    
    if (test[0] == true) {
      scene.add(mesh)
      concElements.push(mesh)
      area += mesh.area
      concCentriodX += mesh.area * mesh.centriod.x
      concCentriodY += mesh.area * mesh.centriod.y
      
    } 
  }
  console.log("Your total area is")
  console.log(area)

  return [concElements, [concCentriodX/area,concCentriodY/area]]
}

var concStressStrain = [[-0.01,-0.01], [-0.003,-4], [-0.002, -4], [0,0]]

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


  //generate an array of functions for the the PM diagram to loop over
  //from pure  compression to tension failure
  var strainProfileCtoT = []
  var slopeStep = ((0.025-(-0.003))/(concMax-rebarMin))/(steps-1)

  //from tension failure on one side to pure tension
  var strainProfileTtoT = []
  var slopeStepTtoT = ((-0.003-(0.025))/(concMax-rebarMin))/(steps-1)

  //from pure tension back to compression failure
  var strainProfileTtoC = []
  var slopeStepTtoC = -((-0.003-(0.025))/(rebarMax-concMin))/(steps-1)

  //from pure compression failure to compression failure
  var strainProfileCtoC = []
  var slopeStepCtoC = -((-0.003-(0.025))/(rebarMax-concMin))/(steps-1)

  for (let i =0; i <= steps-1; i++) {
    //first value is m, next is b
    strainProfileCtoT.push([-i*slopeStep, -0.003-(-i*slopeStep)*concMax])
    //first value is m, next is b
    strainProfileTtoT.push([-(0.025-(-0.003))/(concMax-rebarMin)-slopeStepTtoT*(i), 0.025-(-(0.025-(-0.003))/(concMax-rebarMin)-slopeStepTtoT*(i))*rebarMin])
    //first value is m, next is b
    strainProfileTtoC.push([slopeStepTtoC*i, 0.025-(i*slopeStepTtoC)*(rebarMax)])
    //first value is m, next is b
    strainProfileCtoC.push([(-((-0.003-(0.025))/(rebarMax-concMin)))-slopeStepCtoC*(i), (-0.003-slopeStepCtoC*-(steps-1-i)*-concMin)])
  }
  //var strainProfile = strainProfileCtoT.concat(strainProfileTtoT, strainProfileTtoC, strainProfileCtoC)
  var strainProfile = strainProfileCtoT.concat(strainProfileTtoT, strainProfileTtoC, strainProfileCtoC)
  console.log(strainProfile)
  return strainProfile
}



//assumes a linear strain distribution
function strainFunction(m, x, b) {
  return m*x+b
}

// GENERATE PM DIAPGRAM, [1,0] is typical bending about X axis
function generatePM(vector, concElements, rebarShapes, strainProfiles, concCentriod) {

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
      concMoment += concMaterial.stress(strainFunction(strainProfile[0],concEle.centriod.y, strainProfile[1]))*(concEle.area)*(concEle.centriod.y-concCentriod[1])
    }
  
    for (var steelRebar of rebarShapes) {
      //area times stress(strain)
      steelForce += Math.PI/4*rebarDia[steelRebar.rebarSize]**2*steelMaterial.stress(strainFunction(strainProfile[0],steelRebar.geometry.attributes.position.array[1], strainProfile[1]))
      steelMoment += Math.PI/4*rebarDia[steelRebar.rebarSize]**2*steelMaterial.stress(strainFunction(strainProfile[0],steelRebar.geometry.attributes.position.array[1], strainProfile[1]))*(steelRebar.geometry.attributes.position.array[1]-concCentriod[1])
    }
    var resultForce=steelForce+concForce
    totalForceArray.push(resultForce)
    
    
    totalMomentArray.push((-steelMoment-concMoment)/12)


  }
  return [totalForceArray, totalMomentArray]
}
  
////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////
// Generate Meshing
function generateMesh () {
  allSelectedConc[0].geometry.computeBoundingSphere()
  var center = [allSelectedConc[0].geometry.boundingSphere.center.x, allSelectedConc[0].geometry.boundingSphere.center.y] 
  var radius = allSelectedConc[0].geometry.boundingSphere.radius

  var concPoly = new Polygon(allSelectedConc[0].geometry.parameters.shapes)
  var minSize = document.getElementById( "intSpa" ).value;
  //generate interior points, based on circle
  var createdPnts = generateCirclePnts(center, radius, minSize)
  //generating edge points and hole points
  var boundaryPnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 2.0)[0]
  var holePnts = generateBoundaryPnts(concPoly.basePolyXY, concPoly.holesPolyXY, 2.0)[1]
  var generatedPnts = []
  for (var circlePnt of createdPnts) {
    var TF = ray_casting(circlePnt,concPoly.basePolyXY ,concPoly.holesPolyXY)
    if (TF[0] == true) {
      generatedPnts.push(circlePnt)
    }
  }
  var XYlist = geneterateDelauntor(boundaryPnts, holePnts, generatedPnts)
  var delaunay = Delaunator.from(XYlist);

  var triangleXY = drawTriangles(delaunay.triangles, XYlist) 
  var concElements = drawTrianglesThree(triangleXY, concPoly)
  var concCentriod =  concElements[1]

  return concElements

}

//Generate PM Diagram
function generateScenePM (concElements) {
  var concPoly = new Polygon(allSelectedConc[0].geometry.parameters.shapes)
  var sceneRebar = allSelectedRebar
  var slopes = generateStrains(concPoly.basePolyXY, sceneRebar,100)
  var momentDia = generatePM([1,0], concElements[0], sceneRebar, slopes, concElements[1])
  // console.log('your slopes are')
  // console.log(slopes)
  // console.log(momentDia)
  return momentDia
}

//plotting is completed in plotly
function plotResults (momentDia) {
    var trace1 = {
      x: momentDia[1],
      y: momentDia[0],
      mode: 'lines+markers'
    };
    
    var layout = {
      autosize: false,
      width: 500,
      height: 500,
      xaxis: {
        title: {
          text: 'Moment (kip*ft, + tension in bottom)',
          font: {
          }
        },
      },
      yaxis: {
        title: {
          text: 'Axial Load (kips -compression)',
          font: {
          }
        }
      }
    };
    var data = [trace1];
    if (modal == null) return
    modal.classList.add('active')
    Plotly.newPlot('plot', data, layout);
    overlay.classList.add('active')
}

// Modal popup found from this video https://www.youtube.com/watch?v=MBaw_6cPmAw&ab_channel=WebDevSimplified
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

//delete function
document.addEventListener('keyup', function (e) {
  if (e.key == "Delete") {
    for (var pnt in allSelectedPnts) {
      scene.remove(allSelectedPnts[pnt]);
      let table = document.getElementById("pointData")
      table.innerHTML = ''
    }
    for (var pnt in allSelectedRebar) {
      scene.remove(allSelectedRebar[pnt]);
      let table = document.getElementById("rebarData")
      table.innerHTML = ''
    }
    for (var pnt in allSelectedConc) {
      scene.remove(allSelectedConc[pnt]);
      let table = document.getElementById("concData")
      table.innerHTML = ''
    }
  }
})


//add a new material for each point
function addPoint() {
  var X1 = document.getElementById( "X_Vals" ).value;
  var Y1 = document.getElementById( "Y_Vals" ).value;
  var tempDotGeo = new THREE.BufferGeometry();
  tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [X1,Y1,0], 3 ) );
  var selectedDotMaterial = new THREE.PointsMaterial( { size: 0.5, color: 0x00FF00 } );
  var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
  scene.add( tempDot );
}


//A dictionary that given bar size, returns bar diameter
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

//circle for the rebar
const sprite = new THREE.TextureLoader().load( 'disc.png' );

//add a new material for each point
function addRebar() {
  var X1 = document.getElementById( "X_Vals" ).value;
  var Y1 = document.getElementById( "Y_Vals" ).value;
  var barDia = document.getElementById( "rebar_Vals" ).value;
  var tempDotGeo = new THREE.BufferGeometry();
  tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [X1,Y1,0], 3 ) );
  var selectedDotMaterial = new THREE.PointsMaterial( { size: rebarDia[barDia], sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true  } );
  selectedDotMaterial.color.setHSL( 0.0, 0.0, 0.5 );
  var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
  tempDot.isRebar = true
  tempDot.rebarSize = barDia
  scene.add( tempDot );
}


document.addEventListener('keydown', function (e) {
    //replicate function, use shift key and r to trigger
    if (e.shiftKey == true && (e.key == "R" || e.key == "r")) {
      //FW, make popup
      var Xreplicate =  parseFloat(prompt("What value of X"))
      var Yreplicate =  parseFloat(prompt("What value of Y"))
      alert( "X value = " + Xreplicate + "Y value = " + Yreplicate)
      
      for ( let i = 0; i < allSelectedPnts.length; i ++ ) {
        var xcurrent = allSelectedPnts[i].geometry.attributes.position.array[0]
        var ycurrent = allSelectedPnts[i].geometry.attributes.position.array[1]
        var newX = xcurrent + Xreplicate
        var newY = ycurrent + Yreplicate
        var tempDotGeo = new THREE.BufferGeometry();
        tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [newX,newY,0], 3 ) );
        var selectedDotMaterial = new THREE.PointsMaterial( { size: 0.5, color: 0x00FF00 } );
        var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
        scene.add( tempDot ); //adds updated position
  }
      for ( const pnt of allSelectedRebar ) {
        var xcurrent = pnt.geometry.attributes.position.array[0]
        var ycurrent = pnt.geometry.attributes.position.array[1]
        var rebar_current = pnt.rebarSize
        var newX = xcurrent + Xreplicate
        var newY = ycurrent + Yreplicate
        var tempDotGeo = new THREE.BufferGeometry();
        tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [newX,newY,0], 3 ) );
        var selectedDotMaterial = new THREE.PointsMaterial( { size: rebarDia[rebar_current], sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true  } );
        selectedDotMaterial.color.setHSL( 0.0, 0.0, 0.5 );
        var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
        tempDot.isRebar = true
        tempDot.rebarSize = rebar_current
        scene.add( tempDot ); //adds updated position
        
      }
  }

  })

//function that will update the scene point location, table on left hand side of screen
document.getElementById('pointData').onchange = function (e) {
  e = e || window.event; // || is or
  var data = [];
  var target = e.srcElement || e.target;
  while (target && target.nodeName !== "TR") {
      target = target.parentNode;
  }
  if (target) {
      var cells = target.getElementsByTagName("input");
      var ind = target.rowIndex - 1
      var x_pnt = cells[0].value
      var y_pnt = cells[1].value
      for (var i = 0; i < cells.length; i++) {
          data.push(cells[i].value);
      }
      //must remove old point and make a new one for selection box to register update
      scene.remove(allSelectedPnts[ind])
      var tempDotGeo = new THREE.BufferGeometry();
      tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [x_pnt,y_pnt,0], 3 ) );
      var selectedDotMaterial = new THREE.PointsMaterial( { size: 0.5, color: 0xFF7F00 } );
      var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
      scene.add( tempDot ); //adds updated position
      allSelectedPnts[ind]=tempDot
  }
};

document.getElementById('rebarData').onchange = function (e) {
  e = e || window.event; // || is or
  var data = [];
  var target = e.srcElement || e.target;
  while (target && target.nodeName !== "TR") {
      target = target.parentNode;
  }
  if (target) {
      
      var cells = target.getElementsByTagName("input");
      var rebar = target.getElementsByTagName("select")
      var ind = target.rowIndex - 1
      var x_pnt = cells[0].value
      var y_pnt = cells[1].value
      var rebar_data = rebar[0].value
      for (var i = 0; i < cells.length; i++) {
          data.push(cells[i].value);
      }
      //must remove old point and make a new one for selection box to register update
      scene.remove(allSelectedRebar[ind])
      var tempDotGeo = new THREE.BufferGeometry();
      tempDotGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( [x_pnt,y_pnt,0], 3 ) );
      var selectedDotMaterial = new THREE.PointsMaterial( { size: rebarDia[rebar_data], sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true  } );
      selectedDotMaterial.color.setHSL( 0.0, 0.0, 0.5 );
      var tempDot = new THREE.Points( tempDotGeo, selectedDotMaterial );
      tempDot.isRebar = true
      tempDot.rebarSize = rebar_data
      scene.add( tempDot );
      allSelectedRebar[ind]=tempDot
  }
};

//GUI ITEMS
function pointSelection() {
  var pointTable =  document.getElementById("pointInfo")
  var rebarTable = document.getElementById("rebarInfo")
  var concTable = document.getElementById("concInfo")
  var pointBtn = document.getElementById("Points")
  var rebarBtn = document.getElementById("Rebar")
  var concBtn = document.getElementById("Conc")
  
  pointTable.style.display = 'inline';
  pointBtn.style.backgroundColor = '#1a202c';
  pointBtn.style.color = 'white';
  
  rebarTable.style.display="none"
  rebarBtn.style.backgroundColor = 'white';
  rebarBtn.style.color = '#4a5568'
  
  concTable.style.display="none"
  concBtn.style.backgroundColor = 'white';
  concBtn.style.color = '#4a5568'
}

function rebarSelection() {
  var pointTable =  document.getElementById("pointInfo")
  var rebarTable = document.getElementById("rebarInfo")
  var concTable = document.getElementById("concInfo")
  var pointBtn = document.getElementById("Points")
  var rebarBtn = document.getElementById("Rebar")
  var concBtn = document.getElementById("Conc")
  
  pointTable.style.display="none"
  pointBtn.style.backgroundColor = 'white';
  pointBtn.style.color = '#4a5568';
  
  rebarTable.style.display = 'inline';
  rebarTable.style.width = "100%"
  rebarBtn.style.backgroundColor = '#1a202c';
  rebarBtn.style.color = 'white'
  
  concTable.style.display="none"
  concBtn.style.backgroundColor = 'white';
  concBtn.style.color = '#4a5568'
}

function concSelection() {
  var pointTable =  document.getElementById("pointInfo")
  var rebarTable = document.getElementById("rebarInfo")
  var concTable = document.getElementById("concInfo")
  var pointBtn = document.getElementById("Points")
  var rebarBtn = document.getElementById("Rebar")
  var concBtn = document.getElementById("Conc")
  
  pointTable.style.display="none"
  pointBtn.style.backgroundColor = 'white';
  pointBtn.style.color = '#4a5568';
  
  rebarTable.style.display="none"
  rebarBtn.style.backgroundColor = 'white';
  rebarBtn.style.color = '#4a5568'
  
  concTable.style.display = 'inline	';
  concTable.style.width = "100%"
  concBtn.style.backgroundColor = '#1a202c';
  concBtn.style.color = 'white'
}

document.getElementById("Points").onclick = function(){
    pointSelection();
  }

document.getElementById("Rebar").onclick = function(){
    rebarSelection();
  }

document.getElementById("Conc").onclick = function(){
    concSelection();
  }

//upon clicking this button, generate mesh and pm diagram
document.getElementById("genPM").onclick = function(){
  var x = generateMesh();
  var momentDia = generateScenePM(x);
  plotResults(momentDia)
  }

//END GUI ITEMS



let frame = 0
function animate() {
  frame += 0.1
  var X = document.getElementById( "X_Vals" ).value;
  var Y = document.getElementById( "Y_Vals" ).value;
  //rendering the moving point on the screen, might need an id to filter
  dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [X,Y,0], 3 ) );
  dot.geometry.attributes.position.needsUpdate = true;
  document.getElementById("addPointBtn").onclick = function(){
    addPoint();
  }
  //add the concrete shape
  document.getElementById("addPolyBtn").onclick = function(){
    addConcGeo();
  }
  //adds the hole to the selected shape
  document.getElementById("addHoleBtn").onclick = function(){
    addHole();
  }
  document.getElementById("addRebarBtn").onclick = function(){
    addRebar();
  }
  requestAnimationFrame( animate );
  renderer.render( scene, camera );

}
animate();

const mouse = {
  x: undefined,
  y: undefined
}

//this sets the lower right values, not correct right now
addEventListener('mousemove', (event) => {
  
  mouse.x = (((event.clientX - (window.innerWidth*1/6)) / concGui.offsetWidth)*2-1)*16.6667 //FW, need to mouse normalize here with zoom
  mouse.y = (- ( event.clientY / concGui.offsetHeight )*2+1)*10 //FW, need to mouse normalize here with zoom
  var X = document.getElementById("xVal")
  var Y = document.getElementById("yVal")
  X.innerHTML = String(mouse.x).slice(0,4)
  Y.innerHTML = String(mouse.y).slice(0,4)
})