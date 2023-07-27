/* eslint-disable */
import * as THREE from "three";
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {MeshBVH,MeshBVHVisualizer} from 'three-mesh-bvh'

// gui配置对对象 这是初始化中为了配置gui的对象
let params = {
       firstPerson: false,
       displayCollider: false,
       displayBVH: false,
       visualizeDepth: 10,
       gravity: -30,
       playerSpeed: 5,
       physicsSteps: 5,
}

// 创建碰撞面
// 依赖 three-glow-mesh 插件 原理通过模型拆解计算生成碰撞面，
// 个人理解是通过拆解模型，每个几何体的顶点去生成一个正方体碰撞面模型，用来计算 碰撞面。
export function loadColliderEnvironment(scene, model) {
       //传入场景及相机及模型
       const gltfScene = model
       new THREE.Box3().setFromObject(model)
       gltfScene.updateMatrixWorld(true)
       // visual geometry setup
       const toMerge = {}
       gltfScene.traverse(c => {
       if (c.isMesh && c.material.color !== undefined) {
              const hex = c.material.color.getHex()
              toMerge[hex] = toMerge[hex] || []
              toMerge[hex].push(c)
              }
       })

       let environment = new THREE.Group()
       for (const hex in toMerge) {
              const arr = toMerge[hex]
              const visualGeometries = []
              arr.forEach(mesh => {
              if (mesh.material.emissive && mesh.material.emissive.r !== 0) {
                     environment.attach(mesh)
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
                     environment.add(newMesh)
              }
       }

       // collect all geometries to merge
       const geometries = []
       environment.updateMatrixWorld(true)
       environment.traverse(c => {
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

       let collider = new THREE.Mesh(mergedGeometry)
       collider.material.wireframe = true
       collider.material.opacity = 0.5
       collider.material.transparent = true
       let visualizer = new MeshBVHVisualizer(collider, params.visualizeDepth)
       // visualizer.layers.set(this.currentlayers)
       // collider.layers.set(this.currentlayers)
       scene.add(visualizer)
       scene.add(collider)
       scene.add(environment)
}
            

export function loadplayer(scene) {
       // character 人物模型参考几何体
       let player = new THREE.Mesh(
              new RoundedBoxGeometry(0.5, 1.7, 0.5, 10, 0.5),
              new THREE.MeshStandardMaterial()
       )
       player.geometry.translate(0, -0.5, 0)
       player.capsuleInfo = {
              radius: 0.5,
              segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))
       }
       player.name = 'player'
       player.castShadow = true
       player.receiveShadow = true
       player.material.shadowSide = 2
       player.visible = false
       console.log(player)
       scene.add(player)
       const loader = new GLTFLoader()

       loader.load('RobotExpressive.glb', (gltf) => {
              gltf.scene.scale.set(100, 100, 100)
              let robot = gltf.scene
              robot.capsuleInfo = {
                     radius: 0.5,
                     segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1, 0))
              }
              robot.castShadow = true
              robot.receiveShadow = true
              robot.visible = true
              const animations = gltf.animations
              let mixer = new THREE.AnimationMixer(gltf.scene)
              var action = mixer.clipAction(animations[6])
              action.play()
              scene.add(robot)
       })
}

export default function Roaming(window,camera){
       window.addEventListener('keydown', function (e) {
              switch (e.code) {
                case 'KeyW':
                  this.fwdPressed = true
                  break
                case 'KeyS':
                  this.bkdPressed = truethat
                  break
                case 'KeyD':
                  this.rgtPressed = true
                  break
                case 'KeyA':
                  this.lftPressed = true
                  break
                case 'Space':
                  if (this.playerIsOnGround) {
                    this.playerVelocity.y = 10.0
                  }
                  break
              }
            })
          
       window.addEventListener('keyup', function (e) {
       switch (e.code) {
              case 'KeyW':
              this.fwdPressed = false
              break
              case 'KeyS':
              this.bkdPressed = false
              break
              case 'KeyD':
              this.rgtPressed = false
              break
              case 'KeyA':
              this.lftPressed = false
              break
       }
       })
}

/*
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
*/     