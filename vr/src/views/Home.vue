<template>
  <div class="container">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
  </div>
</template>

<script lang="ts" setup>
import * as THREE from "three";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import a from "@types/three.d.ts";

// 初始化场景
const scene = new THREE.Scene();
// 初始化相机
const camera = new THREE.per();
</script>
<style lang="scss" scoped>
.container {
  width: 100vh;
  height: 100vh;
  background-color: #f0f0f0;
}
</style>
