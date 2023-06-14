<!--
 * @Description: 
 * @Date: 2023-06-06 20:21:36
 * @LastEditTime: 2023-06-14 10:01:48
-->
<!--
 * @Description: 
 * @Date: 2023-06-05 17:53:51
 * @LastEditTime: 2023-06-05 20:27:34
-->
<template>
  <div>
    <div id="overlay">
      <button id="startButton">Play</button>
    </div>
    <div class="container" ref="container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import * as THREE from "three";

import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper.js";
import Ammo from "ammojs-typed";
console.log("Ammo", Ammo);

let mesh, camera, scene, renderer, effect;
let helper;

let ready = false;

const clock = new THREE.Clock();
const container = ref(null);

onMounted(() => {
  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", function () {
    Ammo().then(function () {
      init();
      animate();
    });
  });
});

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );

  // scene

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  scene.add(new THREE.PolarGridHelper(30, 0));

  const listener = new THREE.AudioListener();
  camera.add(listener);
  scene.add(camera);

  const ambient = new THREE.AmbientLight(0xaaaaaa, 1);
  scene.add(ambient);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-1, 1, 1).normalize();
  scene.add(directionalLight);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.value.appendChild(renderer.domElement);

  effect = new OutlineEffect(renderer);
  // model

  function onProgress(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
  }

  const modelFile = "models/mmd/miku/miku_v2.pmd";
  const vmdFiles = ["models/mmd/vmds/wavefile_v2.vmd"];
  const cameraFiles = ["models/mmd/vmds/wavefile_camera.vmd"];
  const audioFile = "models/mmd/audios/wavefile_short.mp3";
  const audioParams = { delayTime: (160 * 1) / 30 };

  helper = new MMDAnimationHelper();

  const loader = new MMDLoader();
  loader.loadWithAnimation(
    modelFile,
    vmdFiles,
    function (mmd) {
      mesh = mmd.mesh;

      helper.add(mesh, {
        animation: mmd.animation,
        physics: true,
      });
      loader.loadAnimation(
        cameraFiles,
        camera,
        function (cameraAnimation) {
          helper.add(camera, {
            animation: cameraAnimation,
          });

          new THREE.AudioLoader().load(
            audioFile,
            function (buffer) {
              const audio = new THREE.Audio(listener).setBuffer(buffer);

              helper.add(audio, audioParams);
              scene.add(mesh);

              ready = true;
            },
            onProgress,
            null
          );
        },
        onProgress,
        null
      );
    },
    onProgress,
    null
  );

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  effect.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  if (ready) {
    helper.update(clock.getDelta());
  }

  effect.render(scene, camera);
}
</script>
<style lang="scss">
.lil-gui {
  z-index: 2 !important; /* TODO Solve this in HTML */
}

@media all and (max-width: 640px) {
  .lil-gui.root {
    right: auto;
    top: auto;
    max-height: 50%;
    max-width: 80%;
    bottom: 0;
    left: 0;
  }
}

#overlay {
  position: absolute;
  font-size: 16px;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.7);
}

#overlay button {
  background: transparent;
  border: 0;
  border: 1px solid rgb(255, 255, 255);
  border-radius: 4px;
  color: #ffffff;
  padding: 12px 18px;
  text-transform: uppercase;
  cursor: pointer;
}

#notSupported {
  width: 50%;
  margin: auto;
  background-color: #f00;
  margin-top: 20px;
  padding: 10px;
}
</style>
