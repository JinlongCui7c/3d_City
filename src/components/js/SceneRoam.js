/* eslint-disable */
import * as THREE from "three";

class SceneRoam{
       constructor(){}

       //核心代码
       loadColliderEnvironment( scene, camera, model) {
              //传入场景及相机及模型
              const that = this
              const gltfScene = model
              new THREE.Box3().setFromObject(model)
              gltfScene.updateMatrixWorld(true)
              that.model=model
              // visual geometry setup
              const toMerge = {}
              gltfScene.traverse(c => {
              if (c.isMesh && c.material.color !== undefined) {
              const hex = c.material.color.getHex()
              toMerge[hex] = toMerge[hex] || []
              toMerge[hex].push(c)
              }
              })
       
              that.environment = new THREE.Group()
              for (const hex in toMerge) {
              const arr = toMerge[hex]
              const visualGeometries = []
              arr.forEach(mesh => {
              if (mesh.material.emissive && mesh.material.emissive.r !== 0) {
              that.environment.attach(mesh)
              } else {
              const geom = mesh.geometry.clone()
              geom.applyMatrix4(mesh.matrixWorld)
              visualGeometries.push(geom)
              }
              })
       
              if (visualGeometries.length) {
              const newGeom = BufferGeometryUtils.mergeBufferGeometries(visualGeometries)
              const newMesh = new THREE.Mesh(newGeom, new THREE.MeshStandardMaterial({
              color: parseInt(hex),
              shadowSide: 2
              }))
              newMesh.castShadow = true
              newMesh.receiveShadow = true
              newMesh.material.shadowSide = 2
              newMesh.name = 'mool'
              that.environment.add(newMesh)
              }
              }
       
              // collect all geometries to merge
              const geometries = []
              that.environment.updateMatrixWorld(true)
              that.environment.traverse(c => {
              if (c.geometry) {
              const cloned = c.geometry.clone()
              cloned.applyMatrix4(c.matrixWorld)
              for (const key in cloned.attributes) {
              if (key !== 'position') {
                     cloned.deleteAttribute(key)
              }
              }
       
              geometries.push(cloned)
              }
              })
       
              // create the merged geometry
              const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false)
              mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {lazyGeneration: false})
       
              that.collider = new THREE.Mesh(mergedGeometry)
              that.collider.material.wireframe = true
              that.collider.material.opacity = 0.5
              that.collider.material.transparent = true
              that.visualizer = new MeshBVHVisualizer(that.collider, that.params.visualizeDepth)
              that.visualizer.layers.set(that.currentlayers)
              that.collider.layers.set(that.currentlayers)
              scene.add(that.visualizer)
              scene.add(that.collider)
              scene.add(that.environment)
       }

       // 加载机器人模型及动画
       // 由于视角问题，通过机器人跟随隐藏几何体的位置便于调整机器人的视角高度，事实上WASD以及跳跃 操作的是几何圆柱体，
       // 只是这里我将圆柱体隐藏了起来，由于之前的测试，如果没有圆柱体这个参照物，无法正确调整机 器人的视角高度，以至于视角相对矮小
       loadplayer(scene, camera) {
              const that = this
              // character 人物模型参考几何体
              that.player = new THREE.Mesh(
              new RoundedBoxGeometry(0.5, 1.7, 0.5, 10, 0.5),
              new THREE.MeshStandardMaterial()
              )
              that.player.geometry.translate(0, -0.5, 0)
              that.player.capsuleInfo = {
              radius: 0.5,
              segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))
              }
              that.player.name = 'player'
              that.player.castShadow = true
              that.player.receiveShadow = true
              that.player.material.shadowSide = 2
              that.player.visible = false
              scene.add(that.player)
              const loader = new GLTFLoader()
              loader.load('/static/public/RobotExpressive.glb', (gltf) => {
              gltf.scene.scale.set(0.3, 0.3, 0.3)
              that.robot = gltf.scene
              that.robot.capsuleInfo = {
              radius: 0.5,
              segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1, 0))
              }
              that.robot.castShadow = true
              that.robot.receiveShadow = true
              that.robot.visible = true
              that.robot.traverse(c => {
              c.layers.set(that.currentlayers)
              })
              const animations = gltf.animations //动画
              that.mixer = new THREE.AnimationMixer(gltf.scene)
              var action = that.mixer.clipAction(animations[6])
              action.play()
              scene.add(that.robot)
              that.reset(camera)
              })
       }

       // 操作事件
       // 这边包括WASD移动以及跳跃和人称切换。通过事件绑定的形式，操作标识开关，操作对应方向的坐标系移动，
       // 这里 只是事件相关，重点在于render函数中
       params = { // gui配置对对象 这是初始化中为了配置gui的对象
              firstPerson: false,
              displayCollider: false,
              displayBVH: false,
              visualizeDepth: 10,
              gravity: -30,
              playerSpeed: 5,
              physicsSteps: 5,
              reset: that.reset
       }

       windowEvent(camera, renderer) {
       const that = this
       window.addEventListener('resize', function () {
              camera.aspect = window.innerWidth / window.innerHeight
              camera.updateProjectionMatrix()
       
              renderer.setSize(window.innerWidth, window.innerHeight)
       }, false)
       
       window.addEventListener('keydown', function (e) {
              switch (e.code) {
              case 'KeyW':
              that.fwdPressed = true
              break
              case 'KeyS':
              that.bkdPressed = true
              break
              case 'KeyD':
              that.rgtPressed = true
              break
              case 'KeyA':
              that.lftPressed = true
              break
              case 'Space':
              if (that.playerIsOnGround) {
                     that.playerVelocity.y = 10.0
              }
              break
              case 'KeyV':
              that.params.firstPerson = !that.params.firstPerson
              if (!that.params.firstPerson) { //人称切换
                     camera
                     .position
                     .sub(that.controls.target)
                     .normalize()
                     .multiplyScalar(10)
                     .add(that.controls.target)
                     that.robot.visible = true
              } else {
                     that.robot.visible = false
              }
              break
              }
       })
       
       window.addEventListener('keyup', function (e) {
              switch (e.code) {
              case 'KeyW':
              that.fwdPressed = false
              break
              case 'KeyS':
              that.bkdPressed = false
              break
              case 'KeyD':
              that.rgtPressed = false
              break
              case 'KeyA':
              that.lftPressed = false
              break
              }
       })
       }

       // 除了碰撞监测，所谓漫游最重要的就是移动和相机跟随
       // 这里要理解一点，除了物体自身的坐标系还存在一个世界坐标系，我们修改物体的同时需要更新其在世界坐标系中的顶点坐标位置。
       // 通过WASD开关来控制模型移动，通过向量的计算以及模型碰撞的监测，调整模型的位置以及相机的位置。
       // reset主要是从高处掉落后是否碰撞到地面，用于不知道地面的高度下，监测地面碰撞面是否形成与是否需要重新下落~
       初始化的一些参数
       upVector = new THREE.Vector3(0, 1, 0)
       tempVector = new THREE.Vector3()
       tempVector2 = new THREE.Vector3()
       tempBox = new THREE.Box3()
       tempMat = new THREE.Matrix4()
       tempSegment = new THREE.Line3()

       updatePlayer(delta, params, fwdPressed, tempVector, upVector, bkdPressed, lftPressed, rgtPressed, tempBox, tempMat, tempSegment, tempVector2, camera) {
              const that = this
              that.playerVelocity.y += that.playerIsOnGround ? 0 : delta * params.gravity
              that.player.position.addScaledVector(that.playerVelocity, delta)
              // move the player
              const angle = that.controls.getAzimuthalAngle()
              //WASD
              if (fwdPressed) {
                tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle)
                that.player.position.addScaledVector(tempVector, params.playerSpeed * delta)
              }
            
              if (bkdPressed) {
                tempVector.set(0, 0, 1).applyAxisAngle(upVector, angle)
                that.player.position.addScaledVector(tempVector, params.playerSpeed * delta)
              }
            
              if (lftPressed) {
                tempVector.set(-1, 0, 0).applyAxisAngle(upVector, angle)
                that.player.position.addScaledVector(tempVector, params.playerSpeed * delta)
              }
            
              if (rgtPressed) {
                tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle)
                that.player.position.addScaledVector(tempVector, params.playerSpeed * delta)
              }
              //更新模型世界坐标
              that.player.updateMatrixWorld()
            
              // adjust player position based on collisions
              const capsuleInfo = that.player.capsuleInfo
              tempBox.makeEmpty()
              tempMat.copy(that.collider.matrixWorld).invert()
              tempSegment.copy(capsuleInfo.segment)
            
              // get the position of the capsule in the local space of the collider
              tempSegment.start.applyMatrix4(that.player.matrixWorld).applyMatrix4(tempMat)
              tempSegment.end.applyMatrix4(that.player.matrixWorld).applyMatrix4(tempMat)
            
              // get the axis aligned bounding box of the capsule
              tempBox.expandByPoint(tempSegment.start)
              tempBox.expandByPoint(tempSegment.end)
            
              tempBox.min.addScalar(-capsuleInfo.radius)
              tempBox.max.addScalar(capsuleInfo.radius)
            
              that.collider.geometry.boundsTree.shapecast({
            
                intersectsBounds: box => box.intersectsBox(tempBox),
            
                intersectsTriangle: tri => {
                  // check if the triangle is intersecting the capsule and adjust the
                  // capsule position if it is.
                  const triPoint = tempVector
                  const capsulePoint = tempVector2
            
                  const distance = tri.closestPointToSegment(tempSegment, triPoint, capsulePoint)
                  if (distance < capsuleInfo.radius) {
                    const depth = capsuleInfo.radius - distance
                    const direction = capsulePoint.sub(triPoint).normalize()
            
                    tempSegment.start.addScaledVector(direction, depth)
                    tempSegment.end.addScaledVector(direction, depth)
                  }
                }
            
              })
            
              // get the adjusted position of the capsule collider in world space after checking
              // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
              // the origin of the player model.
              const newPosition = tempVector
              newPosition.copy(tempSegment.start).applyMatrix4(that.collider.matrixWorld)
            
              // check how much the collider was moved
              const deltaVector = tempVector2
              deltaVector.subVectors(newPosition, that.player.position)
              // if the player was primarily adjusted vertically we assume it's on something we should consider ground
              that.playerIsOnGround = deltaVector.y > Math.abs(delta * that.playerVelocity.y * 0.25)
            
              const offset = Math.max(0.0, deltaVector.length() - 1e-5)
              deltaVector.normalize().multiplyScalar(offset)
            
              // adjust the player model
              that.player.position.add(deltaVector)
              if (!that.playerIsOnGround) {
                deltaVector.normalize()
                that.playerVelocity.addScaledVector(deltaVector, -deltaVector.dot(that.playerVelocity))
              } else {
                that.playerVelocity.set(0, 0, 0)
              }
              // adjust the camera
              camera.position.sub(that.controls.target)
              that.controls.target.copy(that.player.position)
              camera.position.add(that.player.position)
              that.player.rotation.y = that.controls.getAzimuthalAngle() + 3
              if (that.robot) {
                that.robot.rotation.y = that.controls.getAzimuthalAngle() + 3
                that.robot.position.set(that.player.position.clone().x, that.player.position.clone().y, that.player.position.clone().z)
                that.robot.position.y -= 1.5
              }
              // if the player has fallen too far below the level reset their position to the start
              if (that.player.position.y < -25) {
                that.reset(camera)
              }
       }
            

}