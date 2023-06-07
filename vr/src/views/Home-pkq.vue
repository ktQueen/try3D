<!--
 * @Description: 
 * @Date: 2023-06-07 14:19:07
 * @LastEditTime: 2023-06-07 14:19:08
-->
<!--
 * @Description: 
 * @Date: 2023-06-05 17:53:51
 * @LastEditTime: 2023-06-07 12:44:57
-->
<template>
  <div
    id="avatarDom"
    style="width: 414px; height: 700px; display: block; background: #ccc"
  ></div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as dat from "dat.gui";
const GUI = new dat.GUI();

let vertexShaderToon = `
        uniform vec3 color;
        uniform vec3 light;
        varying vec3 vColor;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 viewLight;
        varying vec3 viewPosition;
        varying vec3 viewNormal;
        void main()
        {
            // 直接传递给fs
            vColor = color;
            vPosition = position;
            vUv = uv;
        
            // 转换成视图坐标系（摄像机位置即坐标原点）下的光源坐标/顶点坐标/法线坐标，传递给fs
            // viewLight = normalize( (modelViewMatrix * vec4(light, 1.0)).xyz );
            viewLight = normalize(vec4(light, 1.0).xyz);
            viewPosition = ( modelViewMatrix * vec4(position, 1.0)).xyz;
            viewNormal = normalize(normalMatrix * normal);
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        
        }
    `;
let fragShaderToon = `
        varying vec3 vColor;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 viewLight;
        varying vec3 viewPosition;
        varying vec3 viewNormal;
        uniform sampler2D _MainTex;
        uniform sampler2D _skinMap;
        uniform int hasSkinMap;
        uniform int isHighlight;
        uniform int isRimlight;
        uniform int isDimtoon;
        uniform mat4 modelMatrix;
        void main() {        
            // 计算基础色
            vec3 albedoColor = texture2D(_MainTex, vUv).rgb;
            // 计算卡通渲染下的阶梯阴影
            float diffuse = dot(viewLight, viewNormal);
            if (diffuse > 0.7) {
                diffuse = 1.0;
            }
            else if (diffuse > 0.3) {
                diffuse = 0.7;
            }
            else {
                diffuse = 0.5;
            }
            
        
            // 计算高光反射值（Phong模型）
            float shininessVal=1.0;
            vec3  specularColor = vec3(1.0, 1.0, 1.0);
            vec3 L = viewLight;
            vec3 R = reflect(-viewLight, viewNormal);   // 计算光源沿法线反射后的方向
            vec3 V = normalize(-viewPosition); // 视图坐标系下，坐标的负值即为视线方向
            float specAngle = max(dot(R, V), 0.0); // 两个方向的夹角（点积）即为高光系数，越接近平行，高光越强烈
            float specularFactor = pow(specAngle, shininessVal);
            // 卡通渲染阶梯化处理
            if (specularFactor > 0.8) {
                specularFactor = 0.5;
            }
            else {
                specularFactor = 0.0;
            }
            if(hasSkinMap == 1){
                float skinMask = texture2D(_skinMap, vUv).r;
                if(skinMask == 1.0){
                    specularFactor = 0.0;
                }
            }
        
            // 计算rim lighting
            vec3 rimColor = vec3(1.0, 0.0, 0.0);
            float rimFactor = 0.5;
            float rimWidth = 1.0;
            float rimAngle = max( dot(viewNormal, V), 0.0); // 简单计算，取视线方向和法线方向的夹角（点积），越接近垂直，越靠近模型边缘
            float rimndotv =  max(0.0, rimWidth - rimAngle);
            // 卡通渲染阶梯化处理
            // if (rimndotv > 0.4) {
            //     rimndotv = 1.0;
            // }
            // else {
            //     rimndotv = 0.0;
            // }
        
            if(isDimtoon == 0){
                diffuse = 1.0;
            }
            vec3 finalColor = albedoColor * diffuse;
            if(isHighlight == 1){
                finalColor += specularColor * specularFactor;
            }
            if(isRimlight == 1){
                finalColor += rimColor * rimndotv * rimFactor;
            }
            gl_FragColor = vec4( finalColor, 1.0);
        }
    `;
let vertexShaderOutline = `
    uniform float offset;
    void main() {
      vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );
      gl_Position = projectionMatrix * pos;
    }`;
let fragShaderOutline = `
  uniform vec3 color;
    void main(){
      gl_FragColor = vec4( color, 1.0 );
    }`;
let vertexShaderMask = `
    uniform float offset;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;
let fragShaderMask = `
    void main(){
      gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
    }`;
let vertexShaderEdge = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;

let fragShaderEdge = `
    uniform sampler2D maskTexture;
    uniform vec2 texSize;
    uniform vec3 color;
    uniform float thickness;

    varying vec2 vUv;

    void main() {
        vec2 invSize = thickness / texSize;
        vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);

        vec4 c1 = texture2D( maskTexture, vUv + uvOffset.xy);
        vec4 c2 = texture2D( maskTexture, vUv - uvOffset.xy);
        vec4 c3 = texture2D( maskTexture, vUv + uvOffset.yw);
        vec4 c4 = texture2D( maskTexture, vUv - uvOffset.yw);
        
        float diff1 = (c1.r - c2.r)*0.5;
        float diff2 = (c3.r - c4.r)*0.5;
        
        float d = length(vec2(diff1, diff2));
        gl_FragColor = d > 0.0 ? vec4(color, 1.0) : vec4(0.627, 0.627, 0.627, 0.0);
    }`;
onMounted(() => {
  let domElement = document.getElementById("avatarDom");
  let canvasW = domElement.clientWidth;
  let canvasH = domElement.clientHeight;

  let renderer = new THREE.WebGLRenderer();
  domElement.appendChild(renderer.domElement);

  let modelgroup = new THREE.Group();
  let modelgroupOutline = new THREE.Group();
  let modelgroupMask = new THREE.Group();

  let scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xa0a0a0);
  renderer.setSize(canvasW, canvasH);
  scene.add(modelgroup);

  var camera = new THREE.PerspectiveCamera(45, 500 / 500, 1, 2000);
  camera.position.y = 400;
  camera.lookAt(scene.position);
  camera.aspect = canvasW / canvasH;
  camera.updateProjectionMatrix();
  scene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 25, 0);
  controls.update();

  // 显示光照示意盒
  // var material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  // var object = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), material);
  // object.position.set(0, 0, 100)
  // scene.add(object);

  let outLineType = 2;

  // 用于法线扩张描边的渲染（2 pass）
  let outlineScene = new THREE.Scene();
  outlineScene.background = new THREE.Color(0xa0a0a0);
  outlineScene.add(modelgroupOutline);

  // 用于卷积描边的渲染（需要先渲染一个maskScene，再输出给edgeScene，最后与原始渲染结果叠加，共 3 pass）
  let maskScene = new THREE.Scene();
  maskScene.add(modelgroupMask);
  let maskBuffer = new THREE.WebGLRenderTarget(canvasW, canvasH, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    antialias: true,
  });
  maskBuffer.texture.generateMipmaps = false;
  let edgeMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderEdge,
    fragmentShader: fragShaderEdge,
    depthTest: false,
    uniforms: {
      maskTexture: {
        value: maskBuffer.texture,
      },
      texSize: {
        value: new THREE.Vector2(canvasW, canvasH),
      },
      color: {
        value: new THREE.Color(0.0, 0.0, 0.0),
      },
      thickness: {
        type: "f",
        value: 1.6,
      },
      transparent: true,
    },
  });
  let edgeObj = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(canvasW, canvasH),
    edgeMaterial
  );
  edgeObj.frustumCulled = false;
  // edgeScene渲染在一张平面上，不随controller转动，所以需要一个新的正交相机
  let edgeScene = new THREE.Scene();
  edgeScene.add(edgeObj);
  var edgeCamera = new THREE.OrthographicCamera(
    -canvasW / 2,
    canvasW / 2,
    canvasH / 2,
    -canvasH / 2,
    0,
    1
  );
  edgeCamera.position.z = 1;
  edgeCamera.lookAt(new THREE.Vector3());

  renderer.autoClear = false; //防止渲染器在渲染每一帧之前自动清除其输出
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.clear();
    let oldRenderTarget = renderer.getRenderTarget();

    if (outLineType == 2) {
      // 改变renderTarget，从屏幕到maskBuffer纹理
      renderer.setRenderTarget(maskBuffer);
      renderer.clear();
      renderer.render(maskScene, camera);
      // 重置renderTarget，交还给屏幕
      renderer.setRenderTarget(oldRenderTarget);
      // 渲染edgeScene，其中输入纹理为maskBuffer
      renderer.render(edgeScene, edgeCamera);
      renderer.clearDepth();
      // 渲染原始图像
      renderer.render(scene, camera);
    } else if (outLineType == 1) {
      // 先渲染法线扩张后的黑底，再渲染原始图像
      renderer.render(outlineScene, camera);
      renderer.clearDepth();
      renderer.render(scene, camera);
    } else {
      renderer.render(scene, camera);
    }
  }
  animate();

  // 准备几何体
  let myOBJLoader = new OBJLoader();
  myOBJLoader.load("./pikachiu-obj/pikachiu.obj", function (obj) {
    obj.scale.set(15, 15, 15); //放大obj组对象
    const textureBase = new THREE.TextureLoader().load(
      "./pikachiu-obj/initialShadingGroup_Base_Color.png"
    );
    textureBase.magFilter = THREE.NearestFilter;
    textureBase.minFilter = THREE.NearestFilter;

    obj.children[0].material = new THREE.ShaderMaterial({
      uniforms: {
        offset: {
          type: "f",
          value: 0.05, //偏移值
        },
        color: {
          value: new THREE.Color(0.0, 0.0, 0.0),
        },
        _MainTex: {
          value: textureBase,
        },
        light: {
          // 光源位置
          type: "v3",
          value: new THREE.Vector3(0, 0, 100),
        },
        isHighlight: {
          value: 1,
        },
        isRimlight: {
          value: 1,
        },
        isDimtoon: {
          value: 1,
        },
        hasSkinMap: {
          value: 0,
        },
      },
      vertexShader: vertexShaderToon,
      fragmentShader: fragShaderToon,
    });
    modelgroup.add(obj); //返回的组对象插入场景中

    let objOutlineGeo = new THREE.BufferGeometry();
    objOutlineGeo.copy(obj.children[0].geometry);
    let objOutline = new THREE.Mesh(objOutlineGeo);
    objOutline.scale.set(15, 15, 15); //放大obj组对象
    objOutline.material = new THREE.ShaderMaterial({
      uniforms: {
        offset: {
          type: "f",
          value: 0.05, //偏移值
        },
        color: {
          value: new THREE.Color(0.0, 0.0, 0.0),
        },
      },
      vertexShader: vertexShaderOutline,
      fragmentShader: fragShaderOutline,
    });
    modelgroupOutline.add(objOutline);

    let objMaskGeo = new THREE.BufferGeometry();
    objMaskGeo.copy(obj.children[0].geometry);
    let objMask = new THREE.Mesh(objMaskGeo);
    objMask.scale.set(15, 15, 15); //放大obj组对象
    objMask.material = new THREE.ShaderMaterial({
      vertexShader: vertexShaderMask,
      fragmentShader: fragShaderMask,
      depthTest: false,
    });
    modelgroupMask.add(objMask);
  });

  // 准备效果控制条
  const gui = new GUI({ width: 300 });
  gui.add({ 是否显示高光: true }, "是否显示高光").onChange(function (value) {
    if (value) {
      scene.traverse(function (obj) {
        if (obj.type === "Mesh") {
          obj.material.uniforms.isHighlight.value = 1;
        }
      });
    } else {
      scene.traverse(function (obj) {
        if (obj.type === "Mesh") {
          obj.material.uniforms.isHighlight.value = 0;
        }
      });
    }
  });

  gui
    .add({ 是否显示RimLight: true }, "是否显示RimLight")
    .onChange(function (value) {
      if (value) {
        scene.traverse(function (obj) {
          if (obj.type === "Mesh") {
            obj.material.uniforms.isRimlight.value = 1;
          }
        });
      } else {
        scene.traverse(function (obj) {
          if (obj.type === "Mesh") {
            obj.material.uniforms.isRimlight.value = 0;
          }
        });
      }
    });

  gui
    .add({ 是否显示硬阴影: true }, "是否显示硬阴影")
    .onChange(function (value) {
      if (value) {
        scene.traverse(function (obj) {
          if (obj.type === "Mesh") {
            obj.material.uniforms.isDimtoon.value = 1;
          }
        });
      } else {
        scene.traverse(function (obj) {
          if (obj.type === "Mesh") {
            obj.material.uniforms.isDimtoon.value = 0;
          }
        });
      }
    });

  gui
    .add({ 描边类型: "卷积边缘检测" }, "描边类型", [
      "卷积边缘检测",
      "法线扩张",
      "不描边",
    ])
    .onChange(function (value) {
      if (value == "卷积边缘检测") {
        scene.background = null;
        outLineType = 2;
      } else if (value == "法线扩张") {
        scene.background = null;
        outLineType = 1;
      } else {
        outLineType = 0;
        scene.background = new THREE.Color(0xa0a0a0);
      }
    });

  gui
    .addColor({ 描边颜色: [0.0, 0.0, 0.0] }, "描边颜色")
    .onChange(function (value) {
      edgeMaterial.uniforms.color.value.set(
        new THREE.Color(value[0] / 256.0, value[1] / 256.0, value[2] / 256.0)
      );
      outlineScene.traverse(function (obj) {
        if (obj.type === "Mesh" && obj.material.type == "ShaderMaterial") {
          obj.material.uniforms.color.value.set(
            new THREE.Color(
              value[0] / 256.0,
              value[1] / 256.0,
              value[2] / 256.0
            )
          );
        }
      });
    });
});
</script>
<style>
body {
  font-family: Monospace;
  background-color: #000;
  color: #fff;
  margin: 0px;
  overflow: hidden;
}

#info {
  color: #fff;
  position: absolute;
  top: 10px;
  width: 100%;
  text-align: center;
  z-index: 100;
  display: block;
}

#info a {
  color: #046;
  font-weight: bold;
}
</style>
