# 基于 Three.js 的数字城市

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

## 效果展示

### 基础城市场景：建筑、地面、道路

* 在场景中导入GLTF模型，整个模型可以分为三类，建筑（`CITY_UNTRIANGULATED`），道路（`ROADS`），地面（`other`），对不同的数据分别添加不同的材质系统。

### 光影特效：上升线效果

* 通过获取模型顶点坐标所在的高度Z来限定范围，高度再某一区间内设置成上升线的颜色，其余高度颜色正常，上升线到一定高度后重置。

![1690474706597](image/README/1690474706597.png)

### 光影特效：扫光和渐变

* **颜色渐变**：可通过 `sin`函数模拟中间亮，两边暗的效果，将扫光半径归化到0-PI之间，`0`和 `PI`最暗，`PI/2`最亮。
* **扩散扫光**：设置原点，每一帧通过距离原点的距离限定发光区域，逐渐扩大。

![1690475091369](image/README/1690475091369.gif)

### 光影特效：扩散墙

* 扩散墙通过 `ShaderMaterial`来实现，要实现的效果是墙面随着高度增加透明度也增加，并且边界范围逐渐扩张。

![1690475621041](image/README/1690475621041.gif)

### 光影特效：飞线、飞点

* 通过两点创建贝塞尔曲线，并将该曲线的点序列构造成 `MeshLine`，生成有宽度的线，然后将飞线的纹理对 `MeshLine`做贴图。
* 对 `MeshLine`（[github.com/spite/THREE…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fspite%2FTHREE.MeshLine "https://github.com/spite/THREE.MeshLine") ）中的效果进行修改，实现模型材质的uv移动。

![1690476808796](image/README/1690476808796.gif)

### 降雨效果

* 通过点粒子携带贴图配合自定义着色器材质，控制粒子运动轨迹以及存活时间，在存活时间内控制粒子的透明度以及位置 及颜色、大小，实现降雨、降雪效果的模拟。
* **Three.js** 将粒子系统视为一个基本的几何体，因为它就像基本几何体一样，即有形状，又有位置、缩放因子、旋转属性。粒子系统将 **geometry**对象里的每一个点视为一个单独的粒子，geometry是 [BufferGeometry](https://link.juejin.cn?target=) 的实例，用于储存面片、线、点、顶点位置、向量、颜色等信息，粒子系统 **points**通过这些信息去生成粒子集合，渲染到场景中。

### 碰撞面生成

* 加载模型生成碰撞面：遍历模型 —> THREE.Box3创建包围盒 —> 包围盒通过插件生成碰撞面
* 利用每个几何体的顶点去生成正方体碰撞面，通过对场景模型进行深度优先遍历生成所有的碰撞面。

![1690477612032](image/README/1690477612032.gif)

人物模型加载

场景漫游
