/* eslint-disable */
import TWEEN from '@tweenjs/tween.js'
import * as THREE from "three";

class MyLight{
  constructor(option) {
    this.scene = option.scene || "";
    // 将添加的模拟太阳光源初始化
    this.initSun();
  }

  initSun(i) {
    let position = {}
    let color = '#ffffff'
    let intensity = 8

    position = {
      x: 100,
      y: 100,
      z: 500
    }

    // 平行光可以想象成一个从无限远照射来的光束，通常用来模拟太阳光，可以产生阴影
    if (this.directionalLight) {
      this.directionalLight.setSun(position,color,intensity)
    } else {
      this.directionalLight = new SunLight()
      this.directionalLight.init({
        position,
        color,
        intensity,
        scene: this.scene,
      })
    }
  }    
}

class SunLight{
  constructor(){}

  init({position, color, intensity , scene}) {
    const directionalLight = new THREE.DirectionalLight(color, intensity) // 新建一个平行光源，颜色未白色，强度为1
    this.light = directionalLight
    directionalLight.position.set(position.x, position.y, position.z) // 将此平行光源调整到一个合适的位置
    directionalLight.castShadow = true // 将此平行光源产生阴影的属性打开
    // 设置平行光的的阴影属性，即一个长方体的长宽高，在设定值的范围内的物体才会产生阴影
    const d =2000 //阴影范围
    directionalLight.shadow.camera.left = -d
    directionalLight.shadow.camera.right = d
    directionalLight.shadow.camera.top = d
    directionalLight.shadow.camera.bottom = -d
    directionalLight.shadow.camera.near = 20
    directionalLight.shadow.camera.far = 8000
    directionalLight.shadow.mapSize.x = 2048 // 定义阴影贴图的宽度和高度,必须为2的整数此幂
    directionalLight.shadow.mapSize.y = 2048 // 较高的值会以计算时间为代价提供更好的阴影质量
    directionalLight.shadow.bias = -0.0005 //解决条纹阴影的出现

    scene.add(directionalLight) // 将此平行光源加入场景中，我们才可以看到这个光源
    return directionalLight
}

    
// 设置平行光的信息：包括位置、颜色、强度
setSun(position, color, intensity) {
    this.setTweens(this.light.position, position, 2000)
    this.light.color = new THREE.Color( color )
    this.light.intensity = intensity
}

setTweens(obj, newObj, duration = 1500) {
    var ro = new TWEEN.Tween(obj)
    ro.to(newObj, duration) // 变化后的位置以及动画时间
    ro.easing(TWEEN.Easing.Sinusoidal.InOut)
    ro.onUpdate(function () {
    })
    ro.start()
  }
}
     
export default MyLight;