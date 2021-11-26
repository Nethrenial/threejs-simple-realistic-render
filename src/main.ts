import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./style.css";
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  MeshStandardMaterial,
  Mesh,
  DirectionalLight,
  PCFSoftShadowMap,
  sRGBEncoding,
  ReinhardToneMapping,
  ACESFilmicToneMapping,
  NoToneMapping,
  LinearToneMapping,
  CineonToneMapping,
  CubeTextureLoader,
  // CameraHelper,
  // DirectionalLightHelper,
  Group,
  Clock,
  // Clock,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";

//Intiantiate the loader
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new CubeTextureLoader();

/**
 * Base
 */
// Debug
const gui = new GUI();

const debugObject = {
  envMapIntensity: 1,
};

gui.hide();

gui
  .add(debugObject, "envMapIntensity", 0, 10, 0.001)
  .name("EnMapIntensity")
  .onChange(() => {
    updateAllMaterials();
  });

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Scene
const scene = new Scene();

/**
 * Enviroment
 */

const envMap = cubeTextureLoader.load([
  "../src/static/environments/fireplace/px.png",
  "../src/static/environments/fireplace/nx.png",
  "../src/static/environments/fireplace/py.png",
  "../src/static/environments/fireplace/ny.png",
  "../src/static/environments/fireplace/pz.png",
  "../src/static/environments/fireplace/nz.png",
]);

envMap.encoding = sRGBEncoding;

scene.background = envMap;
scene.environment = envMap;

const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
    }
  });
};

/**
 * Model
 * s
 */

let horse: Group | null = null;

gltfLoader.load(
  "../src/static/models/horse_statue_01_1k.gltf/horse_statue_01_1k.gltf",
  (gltf) => {
    gltf.scene.scale.set(60, 60, 60);
    horse = gltf.scene;
    gltf.scene.position.set(0, -6, 0);
    gltf.scene.rotation.set(0, 0.5 * Math.PI, 0);
    scene.add(gltf.scene);

    gui
      .add(gltf.scene.rotation, "y", -Math.PI, Math.PI, 0.001)
      .name("Rotation");

    updateAllMaterials();
  },
  () => {},
  (error) => {
    console.error(error);
  }
);

/**
 * Lights
 */

const directionalLight = new DirectionalLight(0xffffff, 3);
directionalLight.position.set(26.74, -24.204, -50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 5;
directionalLight.shadow.camera.far = 15;
directionalLight.lookAt(scene.position);

gui.add(directionalLight, "intensity", 0, 10, 0.001).name("Intensity");
gui
  .add(directionalLight.position, "x", -50, 50, 0.01)
  .name("Light x ")
  .onChange(() => {
    directionalLight.lookAt(scene.position);
  });
gui
  .add(directionalLight.position, "y", -50, 50, 0.001)
  .name("Light y ")
  .onChange(() => {
    directionalLight.lookAt(scene.position);
  });
gui
  .add(directionalLight.position, "z", -50, 50, 0.01)
  .name("Light z ")
  .onChange(() => {
    directionalLight.lookAt(scene.position);
  });

// gui
//   .add(directionalLight.shadow.camera, "near", -50, 50, 0.001)
//   .name("Near")
//   .onChange(() => {
//     directionalLightCameraHelper.update();
//   });
// gui
//   .add(directionalLight.shadow.camera, "far", -50, 50, 0.001)
//   .name("Far")
//   .onChange(() => {
//     directionalLightCameraHelper.update();
//   });

scene.add(directionalLight);

// const directionalLightCameraHelper = new CameraHelper(
//   directionalLight.shadow.camera
// );

// scene.add(directionalLightCameraHelper);

// const directionalLightHelper = new DirectionalLightHelper(directionalLight, 5);
// scene.add(directionalLightHelper);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(8, 8, 8);
camera.lookAt(scene.position);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = sRGBEncoding;
renderer.toneMapping = ACESFilmicToneMapping;

gui
  .add(renderer, "toneMapping", {
    None: NoToneMapping,
    Linear: LinearToneMapping,
    Reinhard: ReinhardToneMapping,
    ACESFilmic: ACESFilmicToneMapping,
    Cineon: CineonToneMapping,
  })
  .name("ToneMapping")
  .onFinishChange(() => {
    renderer.toneMapping = Number(renderer.toneMapping);
    updateAllMaterials();
  });

const stats = Stats();
document.body.appendChild(stats.dom);

const clock = new Clock();

/**
 * Animate
 */
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (horse) {
    horse.rotation.y = (elapsedTime * Math.PI) / 4;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
  stats.update();
};

tick();
