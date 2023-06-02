/*
 * @Description:
 * @Date: 2023-06-01 16:58:44
 * @LastEditTime: 2023-06-01 16:58:45
 */
/*
 * @Description:
 * @Date: 2023-05-31 20:08:56
 * @LastEditTime: 2023-06-01 16:56:43
 */
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// 导入动画库
import gsap from "gsap";
// 导入dat.gui,轻量级ui界面控制库，帮助我们快速的设置变量，修改里面的值和数据
import * as dat from "dat.gui";

// console.log("THREE1", THREE);

//目标：纹理常用属性

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

// 导入纹理,官方提供的纹理加载器，实际是加载图片的一个加载器
const textureLoader = new THREE.TextureLoader();
const doorColorTexture = textureLoader.load("./textures/door/search-smart.png");

// console.log(doorColorTexture);
// 设置纹理偏移
// doorColorTexture.offset.x = 0.5;
// doorColorTexture.offset.y = 0.5;
// doorColorTexture.offset.set(0.5, 0.5);

// // 设置纹理旋转
// // 设置旋转的原点
// // doorColorTexture.center.set(0.5, 0.5);
// // 旋转45deg
// // doorColorTexture.rotation = Math.PI / 4;
// // 设置纹理的重复
// doorColorTexture.repeat.set(2, 3);
// // 设置纹理重复的模式
// //水平
// doorColorTexture.wrapS = THREE.MirroredRepeatWrapping; //镜像重复
// //垂直
// doorColorTexture.wrapT = THREE.RepeatWrapping;

//添加物体
const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
// 材质
const basicMaterial = new THREE.MeshBasicMaterial({
  color: "#ffff00",
  map: doorColorTexture,
});
const cube = new THREE.Mesh(cubeGeometry, basicMaterial);
scene.add(cube);

// 初始化渲染器
const renderer = new THREE.WebGL1Renderer();
// 设置渲染的尺寸大小
renderer.setSize(window.innerWidth, window.innerHeight);
console.log("renderer", renderer);
// 将webgl渲染的canvas内容添加到body
document.body.appendChild(renderer.domElement);

//使用渲染器，通过相机将场景渲染进来
// renderer.render(scene, camera);

// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置控制器阻尼，让控制器更有真实的效果，必须在动画循环里调用.update().
controls.enableDamping = true;

// 添加坐标轴辅助器
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 设置时钟
const clock = new THREE.Clock();

window.addEventListener("dblclick", () => {
  const fullScreenElement = document.fullscreenElement;
  if (!fullScreenElement) {
    // 双击控制屏幕进入全屏，退出全屏
    // 让画布对象全屏
    renderer.domElement.requestFullscreen();
  } else {
    // 退出全屏，使用document对象
    document.exitFullscreen();
  }
});

// 渲染函数
function render() {
  controls.update();
  renderer.render(scene, camera);
  // 渲染下一帧的时候就会调用render函数
  requestAnimationFrame(render);
}
render();

// 监听画面变化，更新渲染画面
window.addEventListener("resize", () => {
  console.log("画面变化了");
  // 更新摄像头
  camera.aspect = window.innerWidth / window.innerHeight;
  // 更新摄像机的投影矩阵
  camera.updateProjectionMatrix();
  // 更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 设置渲染器的像素比
  renderer.setPixelRatio(window.devicePixelRatio);
});
