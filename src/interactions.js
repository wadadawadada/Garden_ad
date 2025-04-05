// interactions.js
import * as THREE from 'three';
import { placeGridObjects, placeCenterObject, placeSheepObject } from './scene.js';
import { playSound } from './sounds.js';
const customCameraCoordinates = {
  zone1: { pos: { x: -32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.1 },
  zone2: { pos: { x: 32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.1 },
  zone3: { pos: { x: -32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.34 }
};
let plusButton, addItemLabel, hudContainer;
let currentZoneIndex = 0;
let globalCamera, globalAnimateCamera;
export function setupInteractions(scene, camera, renderer, mixers) {
  globalCamera = camera;
  function animateCameraAndTarget(camera, targetPos, targetZoom, targetLookAt, duration, callback) {
    const startPos = camera.position.clone();
    const startZoom = camera.zoom;
    let startTarget;
    if (window.controls && window.controls.target) {
      startTarget = window.controls.target.clone();
    } else {
      startTarget = new THREE.Vector3();
      camera.getWorldDirection(startTarget);
      startTarget.add(camera.position);
    }
    const startTime = performance.now();
    function easeInOut(t) { return t * t * (3 - 2 * t); }
    function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const tSmooth = easeInOut(t);
      camera.position.lerpVectors(startPos, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), tSmooth);
      camera.zoom = startZoom + (targetZoom - startZoom) * tSmooth;
      camera.updateProjectionMatrix();
      if (window.controls) {
        window.controls.target.lerpVectors(startTarget, new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z), tSmooth);
        window.controls.update();
      } else {
        camera.lookAt(new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z));
      }
      if (t < 1) requestAnimationFrame(update);
      else {
        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
        if (window.controls) {
          window.controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
          window.controls.update();
        } else {
          camera.lookAt(new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z));
        }
        if (callback) callback();
      }
    }
    requestAnimationFrame(update);
  }
  globalAnimateCamera = animateCameraAndTarget;
  function transitionToNight(duration) {
    const dayLights = [];
    scene.traverse(child => { if (child instanceof THREE.DirectionalLight || child instanceof THREE.AmbientLight) dayLights.push(child); });
    let moonLight = scene.getObjectByName('moonLight');
    if (!moonLight) {
      moonLight = new THREE.DirectionalLight(0x8888ff, 0);
      moonLight.name = 'moonLight';
      moonLight.position.set(-20, 50, -20);
      scene.add(moonLight);
    }
    const dayCurrent = dayLights.map(light => light.intensity);
    const moonCurrent = moonLight.intensity;
    const targetFactor = 0.0;
    const targetMoon = 0.8;
    const startTime = performance.now();
    function easeInOut(t) { return t * t * (3 - 2 * t); }
    function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const tSmooth = easeInOut(t);
      dayLights.forEach((light, idx) => {
        light.intensity = dayCurrent[idx] + (dayCurrent[idx] * targetFactor - dayCurrent[idx]) * tSmooth;
      });
      moonLight.intensity = moonCurrent + (targetMoon - moonCurrent) * tSmooth;
      if (t < 1) requestAnimationFrame(update);
    }
    update();
  }
  function transitionToDay(duration) {
    const dayLights = [];
    scene.traverse(child => { if (child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight) dayLights.push(child); });
    let moonLight = scene.getObjectByName('moonLight');
    if (!moonLight) {
      moonLight = new THREE.DirectionalLight(0x8888ff, 0);
      moonLight.name = 'moonLight';
      moonLight.position.set(-20, 50, -20);
      scene.add(moonLight);
    }
    const targets = dayLights.map(light => {
      if (light instanceof THREE.AmbientLight) return 0.8;
      if (light instanceof THREE.DirectionalLight) return 2.0;
      return light.intensity;
    });
    const moonCurrent = moonLight.intensity;
    const startTime = performance.now();
    function easeInOut(t) { return t * t * (3 - 2 * t); }
    function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const tSmooth = easeInOut(t);
      dayLights.forEach((light, idx) => {
        light.intensity = light.intensity + (targets[idx] - light.intensity) * tSmooth;
      });
      moonLight.intensity = moonCurrent + (0 - moonCurrent) * tSmooth;
      if (t < 1) requestAnimationFrame(update);
    }
    update();
  }
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'l') {
      let target;
      if (window.controls && window.controls.target) target = window.controls.target;
      else {
        const dir = new THREE.Vector3(0, 0, -1);
        target = camera.position.clone().add(dir.multiplyScalar(10));
      }
      console.log("Camera coordinates:", "x =", camera.position.x.toFixed(2), "y =", camera.position.y.toFixed(2), "z =", camera.position.z.toFixed(2), "Zoom =", camera.zoom.toFixed(2));
      console.log("Camera target:", "x =", target.x.toFixed(2), "y =", target.y.toFixed(2), "z =", target.z.toFixed(2));
    }
  });
  hudContainer = document.createElement('div');
  hudContainer.style.position = 'absolute';
  hudContainer.style.top = '0';
  hudContainer.style.left = '0';
  hudContainer.style.width = '100%';
  hudContainer.style.height = '100%';
  hudContainer.style.pointerEvents = 'none';
  hudContainer.style.zIndex = '10';
  document.body.appendChild(hudContainer);
  plusButton = document.createElement('img');
  plusButton.src = '/assets/plus.png';
  plusButton.style.position = 'absolute';
  plusButton.style.width = '180px';
  plusButton.style.height = '180px';
  plusButton.style.cursor = 'pointer';
  plusButton.style.pointerEvents = 'auto';
  plusButton.style.display = 'none';
  plusButton.style.animation = 'pulse 1.5s infinite';
  plusButton.style.zIndex = '20';
  hudContainer.appendChild(plusButton);
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.display = 'none';
  menu.style.pointerEvents = 'auto';
  hudContainer.appendChild(menu);
  const skipButton = document.createElement('img');
  skipButton.src = '/assets/skip_day.png';
  skipButton.style.position = 'absolute';
  skipButton.style.width = '250px';
  skipButton.style.height = '250px';
  skipButton.style.left = '50%';
  skipButton.style.top = '50%';
  skipButton.style.transform = 'translate(-50%, -50%)';
  skipButton.style.cursor = 'pointer';
  skipButton.style.pointerEvents = 'auto';
  skipButton.style.display = 'none';
  skipButton.style.animation = 'pop 1.5s ease-out, pulse 1.5s infinite 1.5s';
  hudContainer.appendChild(skipButton);
  const nextDayIcon = document.createElement('img');
  nextDayIcon.src = '/assets/next_day.png';
  nextDayIcon.style.position = 'absolute';
  nextDayIcon.style.width = '350px';
  // nextDayIcon.style.height = '250px';
  nextDayIcon.style.left = '50%';
  nextDayIcon.style.top = 'calc(50% - 200px)';
  nextDayIcon.style.transform = 'translate(-50%, -50%)';
  nextDayIcon.style.cursor = 'default';
  nextDayIcon.style.pointerEvents = 'none';
  nextDayIcon.style.display = 'none';
  nextDayIcon.style.opacity = '0';
  nextDayIcon.style.transition = 'opacity 0.5s ease';
  hudContainer.appendChild(nextDayIcon);
  const styleElem = document.createElement('style');
  styleElem.innerHTML = `
  @keyframes pop {
    0% { transform: translate(-50%, -50%) scale(0.3); }
    60% { transform: translate(-50%, -50%) scale(1); }
    100% { transform: translate(-50%, -50%) scale(0.7); }
  }
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(0.7); }
    50% { transform: translate(-50%, -50%) scale(1); }
    100% { transform: translate(-50%, -50%) scale(0.7); }
  }
  
  /* Мобильные стили для горизонтальной ориентации */
  @media screen and (max-width: 1024px) and (orientation: landscape) {
  #preloader img {
    max-width: 50% !important;
    max-height: 50% !important;
  }

  #preloader-percentage {
    font-size: 24px !important;
    bottom: 80px !important;
  }

  img[src="/assets/logo.png"] {
    width: 180px !important;
  }

  img[src="/assets/plus.png"] {
    width: 120px !important;
    height: 120px !important;
  }

  img[src="/assets/skip_day.png"],
  img[src="/assets/download.svg"] {
    width: 200px !important;
    height: 200px !important;
  }

  img[src="/assets/next_day.png"] {
    width: 250 !important;
    top: 25px !important;
    transform: translateX(-50%) !important;
  }

  img[src="/assets/well_done.png"] {
    width: 50% !important;
    top: 25px !important;
    transform: translateX(-50%) !important;
  }

  img[src="/assets/store.png"] {
    width: 200px !important;
  }

  img[src="/assets/plant.png"] {
    height: 100px !important;
  }

  .menu-item img {
    width: 70px !important;
    height: 70px !important;
  }
}
  `;  
document.head.appendChild(styleElem);

  const zoneItems = {
    zone1: [{ model: 'tomato_3', preview: '/assets/tomato.png' }, { model: 'corn_3', preview: '/assets/corn.png' }],
    zone2: [{ model: 'grape_3', preview: '/assets/grape.png' }, { model: 'strawberry_3', preview: '/assets/strawberry.png' }],
    zone3: [{ model: 'sheep_1', preview: '/assets/sheep.png' }, { model: 'cow_1', preview: '/assets/cow.png' }]
  };
  function getZoneCenter(zoneName) {
    let zone = null;
    scene.traverse(child => { if (child.name === zoneName) zone = child; });
    if (zone) {
      zone.updateWorldMatrix(true, true);
      const bbox = new THREE.Box3().setFromObject(zone);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      return center;
    }
    return new THREE.Vector3();
  }
  function updatePlusButtonPosition() {
    const currentZone = ["zone1", "zone2", "zone3"][currentZoneIndex];
    const center = getZoneCenter(currentZone);
    const vector = center.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    plusButton.style.left = (x - 50) + 'px';
    plusButton.style.top = (y - 50) + 'px';
    requestAnimationFrame(updatePlusButtonPosition);
  }
  updatePlusButtonPosition();
  plusButton.onclick = () => {
    playSound('click_003.mp3');
    addItemLabel.style.opacity = '0';
    setTimeout(() => { addItemLabel.remove(); }, 500);
    const currentZone = ["zone1", "zone2", "zone3"][currentZoneIndex];
    const target = customCameraCoordinates[currentZone];
    animateCameraAndTarget(camera, target.pos, target.zoom, target.target, 10, () => {
      menu.innerHTML = "";
      menu.style.left = plusButton.style.left;
      menu.style.top = plusButton.style.top;
      menu.style.display = 'block';
      const items = zoneItems[currentZone];
      const radius = 130;
      const angles = [225, 315];
      items.forEach((item, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.classList.add('menu-item');
        itemContainer.style.position = 'absolute';
        itemContainer.style.left = '50%';
        itemContainer.style.top = '50%';
        itemContainer.style.transform = 'translate(-50%, -50%)';
        itemContainer.style.transition = 'transform 0.5s ease';
        itemContainer.style.cursor = 'pointer';
        const img = document.createElement('img');
        img.src = item.preview;
        img.style.width = '100px';
        img.style.height = '100px';
        itemContainer.appendChild(img);
        itemContainer.onclick = () => {
          playSound('click_003.mp3');
          Array.from(menu.children).forEach(child => { child.style.transform = 'translate(-50%, -50%)'; });
          setTimeout(() => {
            menu.style.display = 'none';
            plusButton.style.display = 'none';
            if (currentZone === "zone3") {
              if (item.model === 'sheep_1') {
                playSound('sheep.mp3');
                placeSheepObject(scene, currentZone, mixers);
              } else if (item.model === 'cow_1') {
                playSound('cow.mp3');
                placeCenterObject(scene, currentZone, item.model, mixers);
              }
            } else {
              if (["tomato_3", "corn_3", "grape_3", "strawberry_3"].includes(item.model)) {
                playSound('throw_spear.mp3');
              }
              placeGridObjects(scene, currentZone, item.model, mixers);
            }
            let delay = 500;
            if (["tomato_3", "corn_3", "grape_3", "strawberry_3"].includes(item.model)) delay = 1100;
            else if (item.model === 'cow_1' || item.model === 'sheep_1') delay = 900;
            if (item.model === 'cow_1' || item.model === 'sheep_1') {
              nextDayIcon.src = '/assets/well_done.png';
              nextDayIcon.style.width = '600px';
              skipButton.src = '/assets/download.svg';
              skipButton.style.width = '600px';
              skipButton.style.animation = 'pop 0.5s ease-out';
              setTimeout(() => {
                transitionToNight(1500);
                playSound('popup_chest.mp3');
                skipButton.style.display = 'block';
                nextDayIcon.style.display = 'block';
                setTimeout(() => { nextDayIcon.style.opacity = '1'; }, 10);
                setTimeout(() => {
                  let storeIcon = document.createElement('img');
                  storeIcon.src = '/assets/store.png';
                  storeIcon.style.position = 'absolute';
                  storeIcon.style.width = '400px';
                  storeIcon.style.left = '50%';
                  storeIcon.style.top = 'calc(50% + 150px)';
                  storeIcon.style.transform = 'translate(-50%, 0)';
                  storeIcon.style.opacity = '0';
                  storeIcon.style.transition = 'opacity 1s ease';
                  storeIcon.style.pointerEvents = 'none';
                  storeIcon.style.display = 'block';
                  storeIcon.style.zIndex = '10';
                  hudContainer.appendChild(storeIcon);
                  setTimeout(() => { storeIcon.style.opacity = '1'; }, 10);
                }, 600);
              }, delay);
            } else {
              setTimeout(() => {
                transitionToNight(500);
                playSound('popup_chest.mp3');
                skipButton.style.display = 'block';
                nextDayIcon.style.display = 'block';
                setTimeout(() => { nextDayIcon.style.opacity = '1'; }, 10);
              }, delay);
            }
          }, 500);
        };
        menu.appendChild(itemContainer);
        setTimeout(() => {
          const angleRad = angles[index] * Math.PI / 180;
          const dx = radius * Math.cos(angleRad);
          const dy = radius * Math.sin(angleRad);
          itemContainer.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        }, 10);
      });
    });
  };
  skipButton.onclick = () => {
    nextDayIcon.style.opacity = '0';
    setTimeout(() => { nextDayIcon.style.display = 'none'; }, 500);
    skipButton.style.display = 'none';
    transitionToDay(2000);
    if (currentZoneIndex < 2) {
      currentZoneIndex++;
      const nextZone = ["zone1", "zone2", "zone3"][currentZoneIndex];
      const target = customCameraCoordinates[nextZone];
      animateCameraAndTarget(camera, target.pos, target.zoom, target.target, 1000, () => { plusButton.style.display = 'block'; });
    }
  };
}
export function showPlusButton() {
  if (plusButton) {
    plusButton.style.display = 'block';
    if (!addItemLabel) {
      addItemLabel = document.createElement('img');
      addItemLabel.src = '/assets/plant.png';
      addItemLabel.style.position = 'absolute';
      addItemLabel.style.left = '50%';
      addItemLabel.style.top = '50%';
      addItemLabel.style.transform = 'translate(-50%, -50%)';
      addItemLabel.style.width = 'auto';
      addItemLabel.style.height = '150px';
      addItemLabel.style.opacity = '0';
      addItemLabel.style.transition = 'opacity 0.5s ease';
      hudContainer.appendChild(addItemLabel);
      setTimeout(() => { 
        addItemLabel.style.opacity = '1'; 
      }, 100);
      if (globalAnimateCamera && globalCamera) {
        const zone = "zone1";
        const target = customCameraCoordinates[zone];
        globalAnimateCamera(globalCamera, target.pos, target.zoom, target.target, 1000);
        currentZoneIndex = 0;
      }
    }
  }
}
