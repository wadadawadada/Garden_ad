import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadGround } from './scene.js';
import { addBackgroundMusic, playSound } from './sounds.js';
import { setupInteractions, showPlusButton } from './interactions.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 40;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  -frustumSize / 2,
  -1000,
  1000
);
camera.position.set(-14, 27, 11);
camera.zoom = 2.5;
camera.updateProjectionMatrix();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

controls.target.set(0.4, 8, -5);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.update();
const ambientLight = new THREE.AmbientLight(0xffffff, 0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
directionalLight.position.set(20, 50, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.ShadowMaterial({ opacity: 0.3 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0.01;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);
const mixers = [];
loadGround(scene, mixers);
addBackgroundMusic(camera, scene);
setupInteractions(scene, camera, renderer, mixers);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateStartup(duration, callback) {
  const startZoom = 2.5;
  const endZoom = 1.5;
  const ambientTarget = 0.8;
  const directionalTarget = 2;
  const startTime = performance.now();
  function easeInOut(t) {
    return t * t * (3 - 2 * t);
  }
  function update() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const tSmooth = easeInOut(t);
    camera.zoom = startZoom + (endZoom - startZoom) * tSmooth;
    camera.updateProjectionMatrix();
    ambientLight.intensity = ambientTarget * tSmooth;
    directionalLight.intensity = directionalTarget * tSmooth;
    if (t < 1) {
      requestAnimationFrame(update);
    } else {
      if (callback) callback();
    }
  }
  update();
}

window.addEventListener("preloaderDone", () => {
  // Добавляем логотип в левый верхний угол только после исчезновения прелоадера.
  const appLogo = document.createElement('img');
  appLogo.src = '/assets/logo.png';
  appLogo.style.position = 'absolute';
  appLogo.style.top = '10px';
  appLogo.style.left = '10px';
  appLogo.style.width = '300px';
  appLogo.style.zIndex = '10000';
  document.body.appendChild(appLogo);
  animateStartup(2000, () => {
    showPlusButton();
  });
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixers.forEach(mixer => mixer.update(delta));
  controls.update();
  renderer.render(scene, camera);
}
animate();
