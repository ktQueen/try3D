<!--
 * @Description: 
 * @Date: 2023-06-05 18:17:19
 * @LastEditTime: 2023-06-05 18:17:21
-->
<!--
 * @Description: 
 * @Date: 2023-06-05 17:53:51
 * @LastEditTime: 2023-06-05 18:13:19
-->
<template>
  <div class="container" ref="container"></div>
</template>

<script lang="ts" setup>
import * as THREE from "three";
import { ref, onMounted } from "vue";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

// 初始化场景
const scene = new THREE.Scene();
// 初始化相机
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerHeight / window.innerWidth,
  0.1,
  100
);
// 设置相机位置
camera.position.z = 0.1;
// 初始化渲染器
const renderer = new THREE.WebGLRenderer({
  antialias: true, //抗锯齿
});
// 设置渲染器尺寸
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const container = ref(null);

const render = () => {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

// // 添加立方体
// const geometry = new THREE.BoxGeometry(10, 10, 10);
// // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// // const cube = new THREE.Mesh(geometry, material);
// // scene.add(cube);

// // 添加球体
// var arr = ["4_b", "4_f", "4_u", "4_d", "4_l", "4_r"];
// var boxMaterials = [];

// arr.forEach((item) => {
//   //纹理加载
//   let texture = new THREE.TextureLoader().load(`./imgs/living/${item}.jpeg`);
//   // 创建材质
//   boxMaterials.push(new THREE.MeshBasicMaterial({ map: texture }));
// });
// const cube = new THREE.Mesh(geometry, boxMaterials);
// cube.geometry.scale(1, 1, -1);
// scene.add(cube);
// // cube.material = boxMaterials;

// 添加球
const geometry = new THREE.SphereGeometry(5, 32, 32);
const loader = new RGBELoader();
loader.load(`./imgs/living/4_b.jpeg`, (texture) => {
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.geometry.scale(1, 1, -1);
  scene.add(sphere);
});
new THREE.TextureLoader().load();

// 挂载完毕之后获取dom
onMounted(() => {
  // 添加控制器
  const controls = new OrbitControls(camera, container.value);
  controls.enableDamping = true;
  container.value.appendChild(renderer.domElement);
  render();
});
</script>
<style lang="scss" scoped>
.container {
  width: 100vh;
  height: 100vh;
  background-color: #f0f0f0;
}
</style>
