/*
 * @Description:
 * @Date: 2023-06-01 19:28:26
 * @LastEditTime: 2023-06-01 19:30:40
 */
/*
 * @Description:
 * @Date: 2023-05-31 20:08:56
 * @LastEditTime: 2023-06-01 19:28:06
 */
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// 导入动画库
import gsap from "gsap";
// 导入dat.gui,轻量级ui界面控制库，帮助我们快速的设置变量，修改里面的值和数据
import * as dat from "dat.gui";

// console.log("THREE1", THREE);

//目标：置换贴图

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
const doorAplhaTexture = textureLoader.load("./textures/door/search-smart.png");
const doorAoTexture = textureLoader.load("./textures/door/search-smart.png"); //环境遮挡贴图

// 导入置换贴图
const doorHeightTexture = textureLoader.load(
  "./textures/door/search-smart.png"
);

//添加物体
const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 100, 100, 100);
// 材质
const material = new THREE.MeshStandardMaterial({
  color: "#ffff00",
  map: doorColorTexture,
  alphaMap: doorAplhaTexture,
  transparent: true,
  aoMap: doorAoTexture,
  aoMapIntensity: 0.5, //强度
  displacementMap: doorHeightTexture,
  displacementScale: 0.5,
  // opacity: 0.5,
  // side: THREE.DoubleSide, //设置两面
});
material.side = THREE.DoubleSide;
const cube = new THREE.Mesh(cubeGeometry, material);
scene.add(cube);

// 添加平面
const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100, 100);
const plane = new THREE.Mesh(planeGeometry, material);
plane.position.set(1.5, 0, 0);
scene.add(plane);
console.log("plane", plane);
// 给平面设置第二组uv
cubeGeometry.setAttribute(
  "uv2",
  new THREE.BufferAttribute(cubeGeometry.attributes.uv.array, 2)
);

//灯光
// 环境光:四面八方打过来的，没有方向
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
// 直线光源
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

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
