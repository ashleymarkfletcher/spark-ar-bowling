import CANNON from 'cannon'

export default class CannonHelper {
  constructor(worldObjects) {
    this.ShapeTypes = {
      SPHERE: 1,
      PLANE: 2,
      BOX: 4,
      COMPOUND: 8,
      CONVEXPOLYHEDRON: 16,
      HEIGHTFIELD: 32,
      PARTICLE: 64,
      CYLINDER: 128,
      TRIMESH: 256
    }

    // consts for stepping through time in the sim
    this.fixedTimeStep = 1.0 / 30.0 // seconds
    this.maxSubSteps = 3

    this.groundMaterial = new CANNON.Material()

    // pass them in at the beginning?
    this.worldObjects = worldObjects

    // Init our world
    this.world = new CANNON.World()

    // expose the original cannon object for static methods
    this.CANNON = CANNON

    // set the gravity
    this.world.gravity.set(0, -29.82, 0) // m/s²

    // set up the initial objects
    this.worldObjects.forEach((worldObject, i) => {
      // attempt to boost performance by making sleeping more agressive
      // worldObject.physicsObject.sleepSpeedLimit = 1.0

      // add the body to the world
      // this.worldObjects[i].physicsObject = this.world.addBody(worldObject.physicsObject)
      this.world.addBody(worldObject.physicsObject)

      //   // save the transform for later
      //   // using getTransform everywhere seemed to have a performance hit
      //   worldObject.transform = worldObject.sceneObject.getTransform()

      // sync the scale initially so that everything matches
      //   this.syncScale(this.worldObjects[i].transform, this.worldObjects[i].physicsObject)
    })
  }

  bodyPos(cannonBody) {
    return new vec3(cannonBody.position.x, cannonBody.position.y, cannonBody.position.z)
  }

  // return the scale/size of a physics object
  // use for scaling a sceneObject to match the physics world
  bodyScale(cannonBody) {
    const shape = cannonBody.shapes[0]

    switch (shape.type) {
      case this.ShapeTypes.SPHERE:
        return new vec3(shape.radius, shape.radius, shape.radius)
        break
      case this.ShapeTypes.PLANE:
        return new vec3(10, 10, 10)
        break

      case this.ShapeTypes.BOX:
      default:
        const size = shape.halfExtents

        return new vec3(size.x / 8, size.y / 8, size.z / 8)
    }
  }

  addWorldObject(worldObject) {
    this.world.addBody(worldObject.physicsObject)

    worldObject.transform = worldObject.sceneObject.getTransform()

    // sync the scale initially so that everything matches
    this.worldObjects.push(worldObject)

    this.syncScale(worldObject.transform, worldObject.physicsObject)
  }

  syncPos(SceneObject, cannonBody) {
    var transform = SceneObject.transform
    // var newPos = bodyPos(cannonBody)
    // transform.setLocalPosition(newPos)

    transform.x = cannonBody.position.x
    transform.y = cannonBody.position.y
    transform.z = cannonBody.position.z

    // var rot = cannonBody.quaternion.toEuler()]
    var newRot = {}
    var rot = cannonBody.quaternion.toEuler(newRot)
    // Diagnostics.log(rot)
    // var rot =  cannonBody.quaternion.toEuler(cannonBody.quaternion)
    // Diagnostics.log(newRot)
    transform.rotationX = newRot.x
    transform.rotationY = newRot.y
    transform.rotationZ = newRot.z

    // transform.setLocalRotation(new quat(rot.w, rot.x, rot.y, rot.z))
  }

  syncScale(transform, cannonBody) {
    // const transform = sceneObject.getTransform()
    const physicsSize = this.bodyScale(cannonBody)
    transform.setWorldScale(physicsSize)
  }

  resetBody(cannonBody, pos) {
    // Position
    // body.position.setZero()
    // body.previousPosition.setZero()
    // body.interpolatedPosition.setZero()
    // body.initPosition.setZero()

    // orientation
    // body.quaternion.set(0, 0, 0, 1)
    // body.initQuaternion.set(0, 0, 0, 1)
    // body.previousQuaternion.set(0, 0, 0, 1)
    // body.interpolatedQuaternion.set(0, 0, 0, 1)
    // Diagnostics.log(pos)
    cannonBody.position = pos
    // Velocity
    cannonBody.velocity.setZero()
    cannonBody.initVelocity.setZero()
    cannonBody.angularVelocity.setZero()
    cannonBody.initAngularVelocity.setZero()

    // Force
    cannonBody.force.setZero()
    cannonBody.torque.setZero()

    // body.angularVelocity = new CANNON.Vec3(0, 0, 0)
    // body.velocity = new CANNON.Vec3(0, 0, 0)

    cannonBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0)
  }

  update(stepTime) {
    // step the sim, can just take fixed time
    this.world.step(this.fixedTimeStep, stepTime, this.maxSubSteps)

    // this.world.step(stepTime)

    // for loop faster, really worth it?
    for (var i = 0; i < this.worldObjects.length; i++) {
      // const element = array[i];
      this.syncPos(this.worldObjects[i].sceneObject, this.worldObjects[i].physicsObject)
    }
  }

  static makeBox(size, position, rotation) {
    var mat = new CANNON.Material()

    return new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z)),
      // if no rotation on W set something, seems to stall if nothing is set!
      quaternion: new CANNON.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w || 0.5),
      // quaternion: new CANNON.Quaternion(rotation.x || 0.5, rotation.y || 0.5, rotation.z || 0.5, rotation.w || 0.5),
      material: mat
      // DYNAMIC: 1
      // fixedRotation: true
      // linearDamping: 0.1,
      // angularDamping: 0.5
    })
  }

  static makeSphere(size, position, rotation) {
    var mat = new CANNON.Material()

    return new CANNON.Body({
      mass: 1,
      // position: new CANNON.Vec3(0, 10, -10),
      // shape: new CANNON.Sphere(12)
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: new CANNON.Sphere(size.x),
      material: mat
      // DYNAMIC: 1
      // fixedRotation: true
      // linearDamping: 0.1,
      // angularDamping: 0.5
    })
  }

  static makeFloor(size, position, rotation) {
    var mat = new CANNON.Material()
    // ground planes seem to be infinite in size...
    var groundShape = new CANNON.Plane()
    // const groundShape = new CANNON.Box(new CANNON.Vec3(1000, 1000, 1))
    var groundBody = new CANNON.Body({
      mass: 0, // mass == 0 makes the body static
      material: mat,
      shape: groundShape
    })

    // flip the ground axis to match Spark
    // if this isn't done the ground plane will be facing the wrong way
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)

    return groundBody
  }
}
