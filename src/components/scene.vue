<template>
  <div id="all">
    <canvas id="app"></canvas>
    <div id="scene">
      <div id="switch-container" class="grid-container">
        <el-switch
          v-model="value1"
          @change="onSwitchChange1(value1)"
          active-text="降雨效果">
        </el-switch>
        <el-switch
          v-model="value"
          active-text="飞线飞点">
        </el-switch>
        <el-switch
          v-model="value"
          active-text="扩散墙">
        </el-switch>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import Stats from 'stats.js';
import Wall from "./js/Wall";
import RunRing from "./js/RunRing";
import RunLine from "./js/RunLine";
import Raining from "./js/Raining";
import MyLight from "./js/MyLight";
import { SmokePartile } from "./js/smoke/smoke-particle";
import {loadColliderEnvironment} from "./js/SceneRoam";
import { Octree } from 'three/examples/jsm/math/Octree';
import { Capsule } from 'three/examples/jsm/math/Capsule';


let scene; //场景
let camera; //相机
let renderer; //创建渲染器
let controls; //控制器
let pickingScene, pickingTexture; //离屏渲染
let stats;
let loader;
let isWalk = false;
let mixer, animations,playerMesh, prePos;
let clock = new THREE.Clock();
const worldOctree = new Octree();
let playerCollider;

export default {
  mounted() {
    this.init();
    this.createLight();
    this.createControls();
    this.addGLTF();
    // this.addModel();
    // this.addCollider();
    this.addSmoke();
    // this.creatWall();
    // this.creatRunLine();
    // this.addaxesHelper();
    this.render();
    // window.addEventListener("click", this.onDocumentMouseDown);
  },
  methods: {
    // 开关1：降雨效果
    onSwitchChange1(newValue) {
      if(newValue)this.creatRaining();
      else{
        console.log('scene.remove(this.Raining.rainPoint);')
        scene.remove(this.rain.rainPoint);
      }
    },

    init() {
      //创建场景
      scene = new THREE.Scene();
      //天空盒

      const textureCube = new THREE.CubeTextureLoader().load([
        "left.jpg",
        "right.jpg",
        "top.jpg",
        "down.jpg",
        "front.jpg",
        "back.jpg",
      ]);
      scene.background = textureCube; // 作为背景贴图
      
      // 透视投影相机设置
      const width = window.innerWidth; // 窗口宽度
      const height = window.innerHeight; // 窗口高度

      /** 透视投影相机对象 */
      camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000);
      camera.position.set(600, 900, 600);
      camera.lookAt(scene.position);
      // 创建渲染器对象
      const container = document.getElementById("scene");
      renderer = new THREE.WebGLRenderer({ antialias: true });

      // 将 Stats 实例作为属性传递给 WebGLRenderer
      renderer.stats = stats;

      // 设置渲染器的属性
      // renderer.autoClear 是 WebGLRenderer 的一个属性，用于指定在渲染新的帧之前是否自动清除渲染目标的内容
      // 默认情况下，autoClear 的值为 true，这意味着在每次渲染新的帧之前，渲染器会自动清除渲染目标的内容。这包括清除颜色缓冲区、深度缓冲区和模板缓冲区。
      // 如果你将 autoClear 设置为 false，渲染器将不会自动清除渲染目标的内容。这在某些情况下可能是有用的，例如在多个渲染步骤之间保留之前的渲染结果。
      renderer.autoClear = true;

      renderer.setSize(container.clientWidth, container.clientHeight); // 设置渲染区域尺寸
      container.appendChild(renderer.domElement); // body元素中插入canvas对象
      
      //离屏渲染
      pickingScene = new THREE.Scene();
      pickingTexture = new THREE.WebGLRenderTarget(1, 1); 

      // 性能监视器
      stats = new Stats();
      // 0: fps, 1: ms, 2: mb, 3+: custom
      stats.showPanel(0); 
      document.getElementById('scene').appendChild(stats.dom);
    },

    addModel(){
      // console.log('worldOctree',worldOctree)
      // 创建胶囊体
      playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.26);
      // 添加人物
      // loadplayer(scene)
      loader.load(`Xbot.glb`,(gltf) => {
        playerMesh = gltf.scene;
        scene.add(playerMesh);
        // 模型的位置
        playerMesh.position.set(0, 0, 0);
        // 模型初始面朝哪里的位置
        playerMesh.rotateY(-Math.PI / 2);
        // 镜头给到模型
        playerMesh.add(camera);
        // 相机初始位置
        camera.position.set(0, 1, -4);
        // 相机的位置在人物的后方，这样可以形成第三方视角
        camera.lookAt(new THREE.Vector3(0, 0, 1));
        // 输出模型的动作类别
        // console.log(gltf.animations);
        animations = gltf.animations;

        playerMesh.position.y += 19;

        mixer = startAnimation(
          playerMesh,
          animations,
          "idle" 
        );

      });

      // 首先调用了 worldOctree 中的 capsuleIntersect 方法，将玩家的碰撞体 playerCollider 作为参数传入，得到碰撞检测的结果 result。 
      // 如果 result 存在，说明发生了碰撞，需要将玩家位置进行调整
      function playerCollisions() {
        const result = worldOctree.capsuleIntersect(playerCollider);
        console.log('result',result)
        if (result) {
            playerOnFloor = result.normal.y > 0;
            playerCollider.translate(result.normal.multiplyScalar(result.depth));
          }
      }
      
      window.addEventListener("keydown", (e) => {
      // 前进
      if (e.key == "w") {
        playerMesh.translateZ(0.6);
        // 改变胶囊体位置
        playerCollider.translate(new THREE.Vector3(0, 0, 0.6));
        // console.log('playerCollider',playerCollider.end);
        playerCollisions();
        if (!isWalk) {
          isWalk = true;

          mixer = startAnimation(
            playerMesh,
            animations,
            "run"
          );
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      // 后退
      if (e.key == "s") {
        playerMesh.translateZ(-0.1);

        if (!isWalk) {
          // console.log(e.key);
          isWalk = true;

          mixer = startAnimation(
            playerMesh,
            animations,
            "walk" 
          );
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      // 左
      if (e.key == "a") {
        playerMesh.translateX(0.1);
        if (!isWalk) {
          isWalk = true;

          mixer = startAnimation(
            playerMesh,
            animations,
            "walk" 
          );
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      // 右
      if (e.key == "d") {
        playerMesh.translateX(-0.1);
        playerMesh.rotateY(-Math.PI / 32);
        if (!isWalk) {
          isWalk = true;

          mixer = startAnimation(
            playerMesh,
            animations,
            "walk" 
          );
        }
      }
    });

    function startAnimation(skinnedMesh, animations, animationName) {
      const m_mixer = new THREE.AnimationMixer(skinnedMesh);
      const clip = THREE.AnimationClip.findByName(animations, animationName);
      if (clip) {
        const action = m_mixer.clipAction(clip);
        action.play();
      }
      return m_mixer;
    }

  window.addEventListener("mousemove", (e) => {
    if (prePos) {
      playerMesh.rotateY((prePos - e.clientX) * 0.01);
    }
    prePos = e.clientX;
  });

  window.addEventListener("keyup", (e) => {
    if (e.key == "w" || e.key == "s" || e.key == "d" || e.key == "a") {
      isWalk = false;
      mixer = startAnimation(
        playerMesh,
        animations,
        "idle" 
      );
    }
  });

    },

    createControls() {
      controls = new OrbitControls(camera, renderer.domElement);
    },

    render() {
      stats.begin();
      ////// 执行渲染逻辑//////
      this.cityanimate();
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      // 人物模型的动态
      if (mixer) {
        mixer.update(clock.getDelta());
      }

      ////////////////////
      stats.end();
      // console.log('draw calss=',renderer.info.render.calls);
      // renderer.info.update();
      requestAnimationFrame(this.render); // 请求再次执行渲染函数render
    },

    addSmoke(){
      const particle = new SmokePartile(scene);
      // console.log('particle',particle)
      console.log('scene',scene)
    },

    addGLTF() {
      loader = new GLTFLoader();
      loader.load("shanghai.gltf", (gltf) => {
        worldOctree.fromGraphNode(gltf.scene);
        gltf.scene.traverse((child) => {
          // 设置线框材质
          if (child.isMesh) {
            if (["CITY_UNTRIANGULATED"].includes(child.name)) {
                // 拿到模型线框的Geometry
                this.setCityLineMaterial(child);
                this.setCityMaterial(child);
            } else if (["ROADS"].includes(child.name)) {
                //道路
                const material = new THREE.MeshPhongMaterial({
                  color: "#515151",
                });
                const mesh = new THREE.Mesh(child.geometry, material);
                mesh.rotateX(-Math.PI / 2);
                mesh.position.set(
                  child.position.x,
                  child.position.y,
                  child.position.z
                );
                scene.add(mesh);
            } else {
              //地面
              const material = new THREE.MeshPhongMaterial({color: "#A9A9A9",});
              const mesh = new THREE.Mesh(child.geometry, material);
              scene.add(mesh);
              mesh.rotateX(-Math.PI / 2);
              mesh.position.set(
                child.position.x,
                child.position.y,
                child.position.z
              );
            }
          }
        });
      });
    },

    creatRing() {
      this.RunRing1 = new RunRing({
        img: "clice.png",
        scene: scene,
        speed: 1,
        radius: 400,
        position: [
          [400, 20, 400],
          [100, 20, 1200],
        ],
      });
    },

    addCollider(){
      // 给gltf模型添加三维碰撞面
      loader.load("shanghai.gltf", gltf => {
        const model = gltf.scene; // 获取加载后的模型
        // 调用 loadColliderEnvironment 函数生成碰撞体和环境
        loadColliderEnvironment(scene, model);
      });
    },

    setCityMaterial(object) {
      const shader = new THREE.ShaderMaterial({
        uniforms: {
          height: this.height,
          uFlowColor: {
            value: new THREE.Color("#B8860B"),
          },
          uCityColor: {
            value: new THREE.Color("#8B7D6B"),
          },
        },

        vertexShader: `
        varying vec3 vPosition;
        void main()
        {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

        fragmentShader: `
        float distanceTo(vec2 src,vec2 dst)
        {
            float dx=src.x-dst.x;
            float dy=src.y-dst.y;
            float dv=dx*dx+dy*dy;
            return sqrt(dv);
        }
        varying vec3 vPosition;
        uniform float height;
        uniform float uStartTime;
        uniform vec3 uSize;
        uniform vec3 uFlowColor;
        uniform vec3 uCityColor;
        void main()
        {
            //模型的基础颜色
            vec3 distColor=uCityColor;
            // 流动范围当前点z的高度加上流动线的高度
            float topY=vPosition.z+10.;
            if(height>vPosition.z&&height<topY){
                // 颜色渐变
                float dIndex = sin((height - vPosition.z) / 10.0 * 3.14);
                distColor = mix(uFlowColor, distColor, 1.0-dIndex);

            }
            //定位当前点位位置
            vec2 position2D=vec2(vPosition.x,vPosition.y);
            //求点到原点的距离
            float Len=distanceTo(position2D,vec2(0,0));
              if(Len>height*30.0&&Len<(height*30.0+130.0)){
                // 颜色渐变
                float dIndex = sin((Len - height*30.0) / 230.0 * 3.14);
                distColor= mix(uFlowColor, distColor, 1.0-dIndex);
            }
            gl_FragColor=vec4(distColor,1.0);
        }`,
        transparent: true,
      });

      // const city = new THREE.Mesh(object.geometry, shader);
      const city = new THREE.Mesh(object.geometry, new THREE.MeshPhongMaterial({color: "#8B7D6B",}));
  
      city.position.set(
        object.position.x,
        object.position.y,
        object.position.z
      );
      scene.add(city);
      city.rotateX(-Math.PI / 2);
    },

    setCityLineMaterial(object) {
      const edges = new THREE.EdgesGeometry(object.geometry, 1);
      //设置模型的材质
      const lineMaterial = new THREE.LineBasicMaterial({
        // 线的颜色
        color: "#2B2B2B",
      });
      //把数据组合起来
      const lineS = new THREE.LineSegments(edges, lineMaterial);
      //设置数据的位置
      lineS.position.set(
        object.position.x,
        object.position.y,
        object.position.z
      );
      //添加到场景
      scene.add(lineS);
      lineS.rotateX(-Math.PI / 2);
    },

    cityanimate() {
      this.height.value += 0.2;
      if (this.height.value > 100) {
        this.height.value = 0.0;
      }
    },

    creatWall() {
      const wallData = {
        position: {
          x: 50,
          y: 15,
          z: 100,
        },
        speed: 0.5,
        color: "#EEE685",
        opacity: 0.6,
        radius: 1020,
        height: 290,
        renderOrder: 5,
      };

      let wallMesh = new Wall(wallData);
      wallMesh.mesh.material.uniforms.time = this.height;
      scene.add(wallMesh.mesh);
    },

    addaxesHelper(){
      // 红色轴（X轴）：表示水平方向的正方向。在三维空间中，X轴通常表示物体的左右方向。
      // 绿色轴（Y轴）：表示垂直方向的正方向。在三维空间中，Y轴通常表示物体的上下方向。
      // 蓝色轴（Z轴）：表示深度方向的正方向。在三维空间中，Z轴通常表示物体的前后方向。
      // 创建坐标轴对象
      const axesHelper = new THREE.AxesHelper(1000); // 参数表示坐标轴的长度

      // 添加刻度
      const size = 1000; // 刻度的长度
      const divisions = 10; // 刻度的数量
      const gridHelper = new THREE.GridHelper(size, divisions);

      // 将坐标轴和刻度添加到场景中
      scene.add(axesHelper);
      scene.add(gridHelper);
    },

    creatRaining(){
      this.rain = new Raining({
        camera: camera,
        scene: scene,
      });
    },

    createLight(){
      // 创建环境光并设置颜色为白色，强度为 1
      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      // scene.add(ambientLight);

      this.light=new MyLight(
        {scene: scene}
      );
    },
    
    creatRunLine() {
      this.runline1 = new RunLine({
        img: "z1.png",
        camera: camera,
        height: 140,
        v0: new THREE.Vector3(60, 18, -279),
        v1: new THREE.Vector3(-17.5, 111.5, -23),
        el: document.getElementById("scene"),
        scene: scene,
        speed: 1,
        lineWidth: 40,
        type: "run",
      });
      this.runline2 = new RunLine({
        img: "z_112.png",
        camera: camera,
        height: 140,
        v0: new THREE.Vector3(-113, 44, 666),
        v1: new THREE.Vector3(-17.5, 111.5, -23),
        el: document.getElementById("scene"),
        scene: scene,
        speed: 1,
        lineWidth: 40,
        type: "run",
      });
      this.runline3 = new RunLine({
        img: "z_11.png",
        camera: camera,
        height: 140,
        v0: new THREE.Vector3(-418, 113, -12),
        v1: new THREE.Vector3(-17.5, 111.5, -23),
        el: document.getElementById("scene"),
        scene: scene,
        speed: 1,
        lineWidth: 40,
        type: "run",
      });
      this.runline5 = new RunLine({
        img: "n.png",
        camera: camera,
        height: 140,
        v0: new THREE.Vector3(614, 18, 130),
        v1: new THREE.Vector3(-17.5, 111.5, -23),
        el: document.getElementById("scene"),
        scene: scene,
        speed: 1,
        lineWidth: 40,
        type: "run",
      });
    },

    
    onDocumentMouseDown(event) {
      this.gpuClick();
      this.raycastClick(event);
    },

    raycastClick(event) {
      event.preventDefault();
      const vector = new THREE.Vector3(); // 三维坐标对象
      vector.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
      );
      vector.unproject(camera);
      const raycaster = new THREE.Raycaster(
        camera.position,
        vector.sub(camera.position).normalize()
      );
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        // const selected = intersects[0]; // 取第一个物体
        // console.log(`x坐标:${selected.point.x}`);
        // console.log(`y坐标:${selected.point.y}`);
        // console.log(`z坐标:${selected.point.z}`);
      }
    },

    gpuClick() {
      renderer.setRenderTarget(pickingTexture);
      renderer.render(pickingScene, camera);
    },
  },
  
  data() {
    return {
      height: {
        value: 0,
      },
      value1: false,
    };
  },
};
</script>
<style scoped>
html,
body,
#scene {
  width: 100vw;
  height: 100vh;
  z-index: 2;
  position: absolute;
  top: 0%;
}
#switch-container {
  display: grid;
  grid-template-columns: repeat(5, max-content); /* 三列，每列的宽度根据内容自适应 */
  gap: 20px; /* 设置按钮之间的间距为 20 像素 */
  justify-content: center; /* 水平居中对齐 */
  align-items: center; /* 垂直居中对齐 */
  position: absolute; /* 设置为绝对定位 */
  top: 3%; /* 将按钮容器置于场景垂直中间 */
  left: 50%; /* 将按钮容器置于场景水平中间 */
  transform: translate(-50%, -50%); /* 根据容器大小调整位置 */
  z-index: 2; /* 设置层级，使按钮容器悬浮在场景表面 */
}
</style>
