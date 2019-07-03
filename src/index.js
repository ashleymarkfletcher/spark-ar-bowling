const Diagnostics = require('Diagnostics')
const Instruction = require('Instruction')
const CameraInfo = require('CameraInfo')
const Scene = require('Scene')
const Time = require('Time')
const fd = Scene.root
  .child('Device')
  .child('Camera')
  .child('Focal Distance')
const planeTracker = Scene.root.child('planeTracker0')
const TouchGestures = require('TouchGestures')

import CANNON from 'cannon'
import CannonHelper from './cannonHelper'

const rangeMap = (input, inLow, inHigh, outLow, outHigh) => {
  return Math.round(((input - inLow) / (inHigh - inLow)) * (outHigh - outLow) + outLow)
}

// show switch camera instructions on front camera
Instruction.bind(CameraInfo.captureDevicePosition.eq(CameraInfo.CameraPosition.FRONT), 'flip_camera')

var floorPlane = planeTracker.child('plane0')
// get all the pins
var ball = planeTracker.child('BowlingBall')
var pin = planeTracker.child('Bowling_Pin')
var pin2 = planeTracker.child('Bowling_Pin0')
var pin3 = planeTracker.child('Bowling_Pin1')
var pin4 = planeTracker.child('Bowling_Pin2')
var pin5 = planeTracker.child('Bowling_Pin3')
var pin6 = planeTracker.child('Bowling_Pin4')
var pin7 = planeTracker.child('Bowling_Pin5')
var pin8 = planeTracker.child('Bowling_Pin6')
var pin9 = planeTracker.child('Bowling_Pin7')
var pin10 = planeTracker.child('Bowling_Pin8')

var pins = [pin, pin2, pin3, pin4, pin5, pin6, pin7, pin8, pin9, pin10]

// var world = new CANNON.World()
// world.gravity.set(0, -19.82, 0) // m/s²

// Create a sphere
var radius = 6 // m
var sphereBody = new CANNON.Body({
  mass: 2, // kg
  position: new CANNON.Vec3(0, 10, 0), // m
  shape: new CANNON.Sphere(radius)
})

function initPin(pos) {
  var pinBody = new CANNON.Body({
    mass: 0.2,
    position: pos,
    shape: new CANNON.Box(new CANNON.Vec3(2, 10, 2))
    // DYNAMIC: 1
    // fixedRotation: true
    // linearDamping: 0.1,
    // angularDamping: 0.5
  })
  //   world.addBody(pinBody)
  return pinBody
}

var floor = CannonHelper.makeFloor()

var worldObjects = [{ sceneObject: floorPlane, physicsObject: floor }, { sceneObject: ball, physicsObject: sphereBody }]

// ----------------------------- create the pins -------------------------------
// set the base position for the pins
var initialPinX = 0
var initialPinY = 10
var initialPinZ = -70

// this could defintely be done better :')
function initPinPos() {
  return [
    //1
    new CANNON.Vec3(initialPinX + 0, initialPinY + 10, initialPinZ + -10),
    //2
    new CANNON.Vec3(initialPinX + -5, initialPinY + 10, initialPinZ + -15),
    new CANNON.Vec3(initialPinX + 5, initialPinY + 10, initialPinZ + -15),
    //3
    new CANNON.Vec3(initialPinX + -10, initialPinY + 10, initialPinZ + -20),
    new CANNON.Vec3(initialPinX + 0, initialPinY + 10, initialPinZ + -20),
    new CANNON.Vec3(initialPinX + 10, initialPinY + 10, initialPinZ + -20),
    //4
    new CANNON.Vec3(initialPinX + -15, initialPinY + 10, initialPinZ + -25),
    new CANNON.Vec3(initialPinX + -5, initialPinY + 10, initialPinZ + -25),
    new CANNON.Vec3(initialPinX + 5, initialPinY + 10, initialPinZ + -25),
    new CANNON.Vec3(initialPinX + 15, initialPinY + 10, initialPinZ + -25)
  ]
}

var pinPos = initPinPos()
pins.forEach((pin, i) => {
  worldObjects.push({ sceneObject: pin, physicsObject: initPin(pinPos[i]) })
})

var cannonHelper = new CannonHelper(worldObjects)

var loopTimeMs = 30
var lastTime
Time.ms.interval(loopTimeMs).subscribe(function(elapsedTime) {
  if (lastTime !== undefined) {
    var deltaTime = (elapsedTime - lastTime) / 1000
    // world.step(fixedTimeStep, deltaTime, maxSubSteps)

    cannonHelper.update(deltaTime)
  }

  lastTime = elapsedTime
})

TouchGestures.onTap().subscribe(function(e) {
  // convert the x of the tap to an x for force later
  const xDirection = rangeMap(e.location.x, 0, 750, -50, 50)

  throwBall(xDirection)
})

function resetGame() {
  sphereBody.position = new CANNON.Vec3(0, 5, 0)
  sphereBody.angularVelocity = new CANNON.Vec3(0, 0, 0)
  sphereBody.velocity = new CANNON.Vec3(0, 0, 0)
  sphereBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0)

  // reset the pin positions, they change with the pins so don't stay their init value
  pinPos = initPinPos()

  // loop over all the world objects
  for (let i = 0; i < worldObjects.length; i++) {
    // skip the first two objects - ball/floor
    if (i > 1) {
      // reset the body
      cannonHelper.resetBody(worldObjects[i].physicsObject, pinPos[i - 2])
    }
  }
}

var resetTimer
var thrown = false

function throwBall(xDirection) {
  if (thrown) return

  var force = new CANNON.Vec3(xDirection, 0, -300)
  var pos = new CANNON.Vec3(0, 0, 0)

  // apply an impulse on the ball to move it
  sphereBody.applyLocalImpulse(force, pos)

  thrown = true
  if (resetTimer) {
    Time.clearTimeout(resetTimer)
    resetTimer = null
  }

  resetTimer = Time.setTimeout(function(elapsedTime) {
    resetGame()
    thrown = false
  }, 5000)
}
