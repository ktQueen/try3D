/*
 * @Description:
 * @Date: 2023-06-01 09:50:30
 * @LastEditTime: 2023-06-01 09:55:32
 */
/*
 * @Description:
 * @Date: 2023-05-31 20:08:56
 * @LastEditTime: 2023-06-01 09:49:45
 */
import * as THREE from "three";
console.log("THREE1", THREE);

//目标：了解three.js最基本的内容

// 1.创建场景
const scene = new THREE.Scene();

// 2.创建相机
//透视相机
// PerspectiveCamera( fov : Number , aspect : Number , near : Number , far : Number )
// fov — 相机平截头体垂直视野。
// aspect — 相机平截头体纵横比。
// near - 平面附近的相机平截头体。
// far — 相机平截头体远平面。
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// 相机对象位置X,Y,Z坐标
camera.position.set(0, 0, 10);
// 把相机添加到场景当中
scene.add(camera);

//添加物体
//创建几何体
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
// 材质
const cubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff00,
});
//根据几何体和材质创建物体
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//将几何体添加到场景中
scene.add(cube);

// 初始化渲染器
const renderer = new THREE.WebGL1Renderer();
// 设置渲染的尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);
console.log("renderer", renderer);
// 将webgl渲染的canvas内容添加到body
document.body.appendChild(renderer.domElement);

//使用渲染器，通过相机将场景渲染进来
renderer.render(scene, camera);
