/* eslint-disable */
import * as THREE from "three";

class Raining {
  constructor(option) {
    this.pointCount = option.pointCount || 1000; //雨滴的数量
    this.camera = option.camera || ""; 
    this.scene = option.scene || "";
    this.size=option.size || 10; //雨滴的大小
    this.transparent=option.transparent || true;
    this.opacity=option.opacity || 0.5;
    this.vertexColors=option.vertexColors || false; 
    this.sizeAttenuation=option.sizeAttenuation || true;
    this.thing = "";
    this.rainPoint=null;
    this.color =option.color || 0xededed; //雨滴的颜色
    this.creatRainingSystem();
  }

  creatRainingSystem(){
    let geometry = new THREE.BufferGeometry();
  
    // pointCount * 3 共pointCount个点，每个点有x,y,z三个坐标，所以需要*3
    let positions= new Float32Array(this.pointCount * 3);
    for (let i = 0; i < this.pointCount; i++) {
      // 依次生成xyz三维坐标
      // 在 Three.js 中，默认情况下，上方向是正Y轴方向。也就是说，当你创建对象或进行变换操作时，Y轴的正方向被视为上方向。
      positions[i*3] = (Math.random()) * 2000-1000;
      positions[i*3+1] = (Math.random()) * 400;
      positions[i*3+2] = (Math.random()) * 2000-1000;
    }

    // 设置顶点
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    
    // 加载雨滴贴图
    let textureLoader = new THREE.TextureLoader();
    let rainTexture = textureLoader.load('https://s2.loli.net/2023/01/31/qT2vC8G71UtMXeb.png');
    // 点材质
    let material= new THREE.PointsMaterial({
      size: this.size, // 大小
      transparent: this.transparent, // 材质是否透明，配合opacity设置透明度
      opacity: this.opacity, // 透明度
      vertexColors: this.vertexColors, // 顶点着色
      sizeAttenuation: this.sizeAttenuation, // 指定点的大小是否因相机深度而衰减
      color: this.color, // 颜色
      depthTest: true, // 渲染此材质时启用深度测试
      depthWrite: false, // 渲染此材质是否对深度缓冲区有任何影响
      map: rainTexture, // 贴图
      alphaMap: rainTexture, // 贴图灰度
      blending: THREE.AdditiveBlending, // 材质混合模式
    });
    
    // 生成点
    this.rainPoint = new THREE.Points(geometry, material);
    this.scene.add(this.rainPoint);

    // 渲染动效
    this.thing = setInterval(() => {
      if (this.rainPoint) {
        const positions = this.rainPoint.geometry.getAttribute("position").array;
        // 遍历y
        for (let i = 0; i < this.pointCount * 3; i += 3) {
          positions[i + 1] -= Math.random() * 10;
          if (positions[i + 1] < 0) {
            positions[i + 1] = 500;
          }
        }
        this.rainPoint.geometry.getAttribute("position").needsUpdate = true;
      }
    }, 30);
  }
}

export default Raining;

