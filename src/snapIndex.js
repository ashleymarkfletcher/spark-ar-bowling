//@input SceneObject floor
//@input SceneObject[] meshes

//@input SceneObject sphere1
//@input SceneObject sphere2

// XXX: RECREATE THIS IN SPARK!!!

global.touchSystem.touchBlocking = true

// add the delay to stop bugging out on startup
var delayedEvent = script.createEvent('DelayedCallbackEvent')
delayedEvent.bind(function(eventData) {
  init()
})
delayedEvent.reset(0.1)

function init() {
  var Cannon = global.util.Cannon
  var floor = Cannon.makeFloor()

  var worldObjects = [
    // { sceneObject: script.box, physicsObject: box },
    { sceneObject: script.floor, physicsObject: floor }
  ]

  script.meshes.forEach(function(mesh) {
    if (mesh.getComponentCount('Component.ScriptComponent') > 0) {
      var meshSettings = mesh.getFirstComponent('Component.ScriptComponent')

      var shape
      if (meshSettings.api.shapeType == 'sphere') {
        shape = Cannon.makeSphere(meshSettings.api.size, meshSettings.api.position, meshSettings.api.rotation)
      } else {
        shape = Cannon.makeBox(meshSettings.api.size, meshSettings.api.position, meshSettings.api.rotation)
      }

      worldObjects.push({ sceneObject: mesh, physicsObject: shape })
    } else {
      print('scene object is missing a script componenet, add the physicsMesh script')
    }
  })

  var cannon = new Cannon(worldObjects)
  var originalCannon = cannon.CANNON

  var sphere1 = Cannon.makeSphere(10, { x: 0, y: 50, z: 0 }, 0.1)
  var sphere2 = Cannon.makeSphere(10, { x: 0, y: 50, z: 0 }, 0.1)

  // attempt to boost performance by making sleeping more agressive
  // sphere1.sleepSpeedLimit = 1.0
  // sphere2.sleepSpeedLimit = 1.0

  var s1 = { sceneObject: script.sphere1, physicsObject: sphere1 }
  var s2 = { sceneObject: script.sphere2, physicsObject: sphere2 }
  // cannon.addWorldObject(s1)
  // cannon.addWorldObject(s2)

  // sphere1.mass = 0
  // sphere2.velocity = new originalCannon.Vec3(5, 0, 0)

  // // Connect this body to the last one
  // var c = new originalCannon.PointToPointConstraint(
  //   sphere1,
  //   new originalCannon.Vec3(50, 150, 10),
  //   sphere2,
  //   new originalCannon.Vec3(-50, 60, 0)
  // )
  // cannon.world.addConstraint(c)

  var event = script.createEvent('UpdateEvent')
  event.bind(function(eventData) {
    cannon.update()
  })
}
