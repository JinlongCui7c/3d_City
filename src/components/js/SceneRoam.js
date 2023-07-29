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
