<template>
  <div class="ai-container">
    <!-- 视频 -->
    <!-- src="https://vjs.zencdn.net/v/oceans.mp4"
      poster="https://vjs.zencdn.net/v/oceans.png" -->
    <video-player
      class="video-player vjs-big-play-centered"
      crossorigin="anonymous"
      src="https://cnbj1.fds.api.xiaomi.com/static-fe/production/mione-web/video/gateway.mp4"
      poster="https://vjs.zencdn.net/v/oceans.png"
      playsinline
      controls
      :volume="0.6"
      :height="320"
      :playback-rates="[0.7, 1.0, 1.5, 2.0]"
    />
    <div class="person-container">
      <!-- 加载动画 -->
      <div class="loading" id="js-loader"><div class="loader"></div></div>
      <!-- 画布 -->
      <div class="wrapper">
        <!-- The canvas element is used to draw the 3D scene -->
        <canvas id="c"></canvas>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import * as THREE from "three";
// GLTF 是引用的 3D 模型格式
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
/* Follow the tutorial here:
https://tympanus.net/codrops/2019/10/14/how-to-create-an-interactive-3d-character-with-three-js/
*/
import { VideoPlayer } from "@videojs-player/vue";
import "video.js/dist/video-js.css";

onMounted(() => {
  // Set our main variables
  let scene,
    renderer,
    camera,
    model, // Our character
    neck, // Reference to the neck bone in the skeleton
    waist, // Reference to the waist bone in the skeleton
    possibleAnims, // Animations found in our file
    mixer, // THREE.js animations mixer
    idle, // Idle, the default state our character returns to
    clock = new THREE.Clock(), // Used for anims, which run to a clock instead of frame rate
    currentlyAnimating = false, // Used to check whether characters neck is being used in another anim
    raycaster = new THREE.Raycaster(), // Used to detect the click on our character
    loaderAnim = document.getElementById("js-loader");

  init();

  // 初始化函数
  function init() {
    //canvas 元素
    const canvas = document.querySelector("#c");
    // 背景色（淡灰色）
    // Three.js 不能使用字符串格式的颜色值，如 '#f1f1f1'，而使用十六机制的整数，如 0xf1f1f1
    const backgroundColor = 0xf1f1f1;

    // 1.创建场景
    // Init the scene
    scene = new THREE.Scene();
    // 设置背景色
    scene.background = new THREE.Color(backgroundColor);
    // 添加雾化效果
    scene.fog = new THREE.Fog(backgroundColor, 60, 100);

    // 2.渲染器（renderer）
    // Init the renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      // 启用抗齿距
      antialias: true,
    });
    // 启用了 shadowMap，使得人物对象能投射阴影
    renderer.shadowMap.enabled = true;
    // 基于设备设置了像素比，使得移动端的渲染效果更清晰，否则 canvas 会在高分度屏幕上呈现像素化
    renderer.setPixelRatio(window.devicePixelRatio);
    // 将渲染器添加到 document.body
    // document.body.appendChild(renderer.domElement);

    // 3.摄像机
    // Add a camera
    // 创建一个透视摄像机，并设置其视场（field of view, fov）为 50，横纵向比例为视口宽高比，默认的前后边界裁剪区域
    camera = new THREE.PerspectiveCamera(
      50,
      60 / 60,
      // window.innerWidth / 10 / (window.innerHeight / 10),
      0.1,
      1000
    );
    // 将其往后 30 个单位和往下 3 个单位位移
    camera.position.z = 30;
    camera.position.x = 0;
    camera.position.y = -3;

    // // 6.添加模型
    // // 加载并应用纹理
    // // 创建一个新纹理和材质: Blender 中已对模型进行贴图（map）
    // // 纹理不仅是一张图片的 URL，它要作为一个新纹理，需要通过 TextureLoader 加载
    // let stacy_txt = new THREE.TextureLoader().load(
    //   "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy.jpg"
    // );
    // stacy_txt.flipY = false;

    // // 我们将为模型的材质使用一些新选项：
    // // 1. 将 stacy_txt 纹理赋值给 map 属性；
    // // 2. 将 skinning 设置为 true，这对动画模型至关重要。
    // // 最后将该材质赋值给 stacy_mtl。
    // const stacy_mtl = new THREE.MeshPhongMaterial({
    //   map: stacy_txt,
    //   color: 0xffffff,
    //   skinning: true,
    // });

    // 引用模型
    // GLTF 格式（.glb），尽管 Three.js 支持多种 3D 模型格式，但这是推荐的格式
    // const MODEL_PATH =
    //   // "https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy_lightweight.glb";
    //   ;
    // 创建一个 loader
    var loader = new GLTFLoader();
    //  loader 的 load 方法，它接受 4 个参数，分别是：模型路径、模型加载成功后的回调函数、模型加载中的回调函数、报错的回调函数。
    loader.load(
      // "/models/stacy_lightweight.glb",
      "/about/girl.glb",
      function (gltf) {
        console.log("gltf", gltf);
        // GLTF 文件本身（即传入该回调函数的形参 gltf）由两部分组成，场景（gltf.scene，【译者注：即模型】）和动画（gltf.animations）
        model = gltf.scene;
        // let fileAnimations = gltf.animations;
        // // 使用模型的 traverse 方法遍历所有网格（mesh）以启用投射和接收阴影的能力
        // model.traverse((o) => {
        //   if (o.isMesh) {
        //     o.castShadow = true;
        //     o.receiveShadow = true;
        //     // 现在我们有了纹理材质。因为模型（gltf.scene）仅有一个对象，所以我们直接在 traverse 方法的阴影相关代码下方增添一行代码
        //     o.material = stacy_mtl;
        //   }
        //   // 所有骨头，并找到脖子和脊柱（即名字）
        //   if (o.isBone) {
        //     console.log(o.name);
        //   }
        //   // 找到脖子骨头和下脊柱骨头。以视口中点为基准，这两个骨头将朝向光标进行旋转
        //   // Reference the neck and waist bones
        //   if (o.isBone && o.name === "mixamorigNeck") {
        //     neck = o;
        //   }
        //   if (o.isBone && o.name === "mixamorigSpine") {
        //     waist = o;
        //   }
        // });
        // // 模型很小；3D 模型如同矢量图形，支持不失真缩放；Mixamo 输出的模型很小，因此，我们需要对它进行放大。
        // 将模型在原来大小的基础上放大 7 倍
        model.scale.set(7, 7, 7);
        // 将模型向下移动 11 个单位，以保证它是站在地板上的
        model.position.y = -11;
        scene.add(model);
        loaderAnim.remove();
        // // 9.模型动画
        // // 创建一个 AnimationMixer，它是用于播放场景中特定对象动画的播放器。
        // mixer = new THREE.AnimationMixer(model);
        // // Stacy 的文件内实际上有 10 个动画，而我们仅用了其中一个
        // // 获得除“空闲（idle）”外的 AnimationClip 列表（因为我们并不想在点击 Stacy 时随机播放的动画中包含“空闲”）
        // let clips = fileAnimations.filter((val) => val.name !== "idle");
        // possibleAnims = clips.map((val) => {
        //   // 将所有这些 clip 转为 Three.js AnimationClip
        //   let clip = THREE.AnimationClip.findByName(clips, val.name);
        //   // 将脖子和脊柱骨头从中剔除
        //   clip.tracks.splice(3, 3);
        //   clip.tracks.splice(9, 3);
        //   clip = mixer.clipAction(clip);
        //   return clip;
        // });
        // // 创建 AnimationClip，并通过 fileAnimations 查找一个名为 idle（空闲）的动画。这个名字是在 Blender 中设置的
        // let idleAnim = THREE.AnimationClip.findByName(fileAnimations, "idle");
        // idleAnim.tracks.splice(3, 3);
        // idleAnim.tracks.splice(9, 3);
        // // 使用 mixer 的 clipAction 方法，并传入 idleAnim 参数。我们将这个 clipAction 命名为 idle。
        // idle = mixer.clipAction(idleAnim);
        // // 调用 idle 的 play 方法
        // idle.play();
      },
      undefined, // We don't need this function
      function (error) {
        console.error(error);
      }
    );

    // 4.光，创建两个光——环境光和定向光。然后，通过 scene.add(light) 将它们加到场景中。
    // Add lights
    // 环境光为强度 0.61 的白光，然后将其放置在中心点上方 50 单位。
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(0, 50, 0);
    // Add hemisphere light to scene
    scene.add(hemiLight);

    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    // Add directional Light to scene
    scene.add(dirLight);

    // 5.地板
    // Floor
    // 首先，创建一个二维平面，它足够大：5000 个单位（确保无缝背景）。
    let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    // 创建一个材质
    // 该网格足够大，被平放作为地面。网格的颜色是 0xeeeeee，虽然比背景色稍暗，但在灯光的作用下，与不受灯光影响的背景融为一体。
    let floorMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee, //0xeeeeee,//地板的材质颜色
      shininess: 0,
    });
    // 与几何图形结合为网格（mesh），最后将该网格添加到场景中
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    // 为了配合后续添加的人物模型，我们将地板向下移动 11 个单位
    floor.position.y = -11;
    scene.add(floor);

    // 8.处理动画
    // 添加一个圆符。
    // 这是一个很大但远离我们的 3D 球体，并使用 BasicMaterial 材质。
    // 该材质不具备先前使用的 PhongMaterial 材质所拥有的光泽和投射并接收阴影的特性。
    // 因此，它在该场景中能作为一个平面圆，很好地衬托着 Stacy
    let geometry = new THREE.SphereGeometry(8, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xf2ce2e }); // 0x9bffaf
    let sphere = new THREE.Mesh(geometry, material);

    sphere.position.z = -15;
    sphere.position.y = -2.5;
    sphere.position.x = -0.25;
    scene.add(sphere);
  }

  update();

  // Three.js 应用一般都会依赖于一个每帧都会执行的更新函数
  function update() {
    // // 为了让动画持续运行，mixer 需要不断更新。因此，我们需要让它在 update() 函数内进行更新。
    // if (mixer) {
    //   // mixer 的 update 方法以 clock（已在项目顶部定义）作为参数。
    //   // 因为是基于时间（增量）进行更新，所以动画并不会因帧率下降而变慢。如果是基于帧率执行动画，则动画的快慢取决于帧率的高低，
    //   mixer.update(clock.getDelta());
    // }

    // if (resizeRendererToDisplaySize(renderer)) {
    //   const canvas = renderer.domElement;
    //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
    //   camera.updateProjectionMatrix();
    // }
    // 更新函数内，renderer 会渲染摄像机下的场景，并立刻再次调用自身。
    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  // // 场景也需要同步调整大小以保持比例:不断检查 renderer 的尺寸是否与 canvas 相等，若不等则设置 renderer 的尺寸，最后返回布尔值变量 needResize
  // // 建议通过监听 window resize 事件处理
  // function resizeRendererToDisplaySize(renderer) {
  //   const canvas = renderer.domElement;
  //   let width = window.innerWidth;
  //   let height = window.innerHeight;
  //   let canvasPixelWidth = canvas.width / window.devicePixelRatio;
  //   let canvasPixelHeight = canvas.height / window.devicePixelRatio;

  //   const needResize =
  //     canvasPixelWidth !== width || canvasPixelHeight !== height;
  //   if (needResize) {
  //     renderer.setSize(width, height, false);
  //   }
  //   return needResize;
  // }

  // // 并不能简单地为 Stacy 添加一个点击事件，毕竟她不是 DOM 的一部分。
  // // 这里采用射线（raycasting）实现点击，即向指定方向发射激光束，然后返回被击中的对象集合。
  // // 在该案例中，激光线是从摄像机射向光标。
  // //  PC
  // window.addEventListener("click", (e) => raycast(e));
  // // 触屏：触屏情况下，将 touch 参数设为 true
  // window.addEventListener("touchend", (e) => raycast(e, true));

  // function raycast(e, touch = false) {
  //   var mouse = {};
  //   // WebGL，坐标轴的原点在画布中心，坐标轴的范围是 -1 至 1
  //   if (touch) {
  //     // 若 touch 为 true，mouse.x 和 mouse.y 则被设为 changedTouches[0] 的坐标
  //     mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
  //     mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
  //   } else {
  //     // 反之被设为鼠标的坐标
  //     mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
  //     mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
  //   }
  //   // update the picking ray with the camera and mouse position
  //   // 表示光线从摄像机射向鼠标
  //   raycaster.setFromCamera(mouse, camera);

  //   // calculate objects intersecting the picking ray
  //   // 得到被射中的对象数组。若数组不为空，那么即可认为第一个子项就是被选中的对象
  //   var intersects = raycaster.intersectObjects(scene.children, true);

  //   if (intersects[0]) {
  //     var object = intersects[0].object;

  //     // 选中对象的名字为 stacy
  //     if (object.name === "stacy") {
  //       // 我们同时也会判断 currentlyAnimating 是否为 false，即当有动画正在执行（idle 除外）时，不会执行新动画。
  //       if (!currentlyAnimating) {
  //         currentlyAnimating = true;
  //         playOnClick();
  //       }
  //     }
  //   }
  // }

  // // Get a random animation, and play it
  // function playOnClick() {
  //   // 基于 possibleAnims 数组长度创建一个随机数
  //   let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
  //   playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
  // }

  // // 参数有：idle（from，即从 idle 开始），从 idle 到新动画（possibleAnims[anim]）的过渡时间；
  // // 最后一个参数是从当前动画回到 idle 的过渡时间。
  // function playModifierAnimation(from, fSpeed, to, tSpeed) {
  //   // 将其 播放次数 设为 1 次，因为一旦动画播放完成（也许我们之前已播放过），它需要重置后才能再次播放
  //   to.setLoop(THREE.LoopOnce);
  //   // 该函数做的第一件事是 重置 to 动画，即将要播放的动画。
  //   to.reset();
  //   to.play();
  //   from.crossFadeTo(to, fSpeed, true);
  //   // 开启了一个定时器，用于将当前动画恢复到 from 动画（即 idle）
  //   setTimeout(function () {
  //     from.enabled = true;
  //     to.crossFadeTo(from, tSpeed, true);
  //     // currentlyAnimating 设置 false（这样就允许再次点击 Stacy）
  //     currentlyAnimating = false;
  //     // setTimeout 的时间计算方法为：
  //     // 动画长度(* 1000 是因为过渡时间以秒而不是毫秒为单位)减去动画切入和切出的过渡时间（同样以秒为单位设置，所以需要 * 1000）来得到
  //   }, to._clip.duration * 1000 - (tSpeed + fSpeed) * 1000);
  // }

  // // 动作：朝向光标
  // document.addEventListener("mousemove", function (e) {
  //   var mousecoords = getMousePos(e);
  //   if (neck && waist) {
  //     moveJoint(mousecoords, neck, 50);
  //     moveJoint(mousecoords, waist, 30);
  //   }
  // });

  // function getMousePos(e) {
  //   return { x: e.clientX, y: e.clientY };
  // }

  // //moveJoint 函数接收 3 个参数，分别是：当前鼠标的位置，需要移动的关节和允许关节旋转的角度范围
  // function moveJoint(mouse, joint, degreeLimit) {
  //   // degrees 的变量，该变量的值来自于返回对象为 {x, y} 的 getMouseDegrees 函数。然后，基于这个值对关节分别在 x、y 轴进行旋
  //   let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
  //   joint.rotation.y = THREE.MathUtils.degToRad(degrees.x);
  //   joint.rotation.x = THREE.MathUtils.degToRad(degrees.y);
  // }

  // // 判断鼠标位于视口上半部、下半部、左半部和右半部的具体位置。
  // // 例如，当鼠标在视口中点与右边界的中间，该函数会得到 right = 50%；当鼠标在视口中点与上边界的四分之一位置，该函数会得到为 up = 25%（译者注：以视口中点为起始点）。
  // // 一旦函数得到这些百分比，它会返回基于 degreelimit 的百分比。
  // // 所以，当该函数确定鼠标的位置为 75% right 和 50% up，那么会返回 x 轴 75% 的角度限值和 y 轴 50% 的角度限值。其余同理
  // function getMouseDegrees(x, y, degreeLimit) {
  //   let dx = 0,
  //     dy = 0,
  //     xdiff,
  //     xPercentage,
  //     ydiff,
  //     yPercentage;

  //   let w = { x: window.innerWidth, y: window.innerHeight };

  //   // Left (Rotates neck left between 0 and -degreeLimit)
  //   // 1. If cursor is in the left half of screen
  //   if (x <= w.x / 2) {
  //     // 2. Get the difference between middle of screen and cursor position
  //     xdiff = w.x / 2 - x;
  //     // 3. Find the percentage of that difference (percentage toward edge of screen)
  //     xPercentage = (xdiff / (w.x / 2)) * 100;
  //     // 4. Convert that to a percentage of the maximum rotation we allow for the neck
  //     dx = ((degreeLimit * xPercentage) / 100) * -1;
  //   }

  //   // Right (Rotates neck right between 0 and degreeLimit)
  //   if (x >= w.x / 2) {
  //     xdiff = x - w.x / 2;
  //     xPercentage = (xdiff / (w.x / 2)) * 100;
  //     dx = (degreeLimit * xPercentage) / 100;
  //   }
  //   // Up (Rotates neck up between 0 and -degreeLimit)
  //   if (y <= w.y / 2) {
  //     ydiff = w.y / 2 - y;
  //     yPercentage = (ydiff / (w.y / 2)) * 100;
  //     // Note that I cut degreeLimit in half when she looks up
  //     dy = ((degreeLimit * 0.5 * yPercentage) / 100) * -1;
  //   }
  //   // Down (Rotates neck down between 0 and degreeLimit)
  //   if (y >= w.y / 2) {
  //     ydiff = y - w.y / 2;
  //     yPercentage = (ydiff / (w.y / 2)) * 100;
  //     dy = (degreeLimit * yPercentage) / 100;
  //   }
  //   return { x: dx, y: dy };
  // }
});
</script>

<style lang="scss">
body,
html {
  margin: 0;
  padding: 0;
  background: #25252b;
  width: 100%;
  height: 100%;
}
* {
  touch-action: manipulation;
}
*,
*:before,
*:after {
  box-sizing: border-box;
}
.ai-container {
  position: relative;
  color: white;
  letter-spacing: 2px;
  font-size: 11px;
  font-family: "Poppins", sans-serif;
  width: 768px;
  height: 320px;
}

.person-container {
  width: 500px;
  height: 500px;
  position: absolute;
  bottom: 30px;
  right: 0px;
}
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
#c {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.loading {
  position: absolute;
  z-index: 50;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: #f1f1f1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader {
  -webkit-perspective: 120px;
  -moz-perspective: 120px;
  -ms-perspective: 120px;
  perspective: 120px;
  width: 100px;
  height: 100px;
}

.loader:before {
  content: "";
  position: absolute;
  left: 25px;
  top: 25px;
  width: 50px;
  height: 50px;
  background-color: #9bffaf;
  animation: flip 1s infinite;
}

@keyframes flip {
  0% {
    transform: rotate(0);
  }

  50% {
    transform: rotateY(180deg);
  }

  100% {
    transform: rotateY(180deg) rotateX(180deg);
  }
}
</style>
