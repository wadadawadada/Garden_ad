import { placeGridObjects, placeCenterObject, placeSheepObject } from './objectPlacer.js';
import { playSound } from './sounds.js';
import { animateCameraAndTarget, transitionToNight, transitionToDay } from './transitions.js';
import { createHUD, updatePlusButtonPosition } from './hud.js';

const customCameraCoordinates = {
  zone1: { pos: { x: -32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.1 },
  zone2: { pos: { x: 32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.1 },
  zone3: { pos: { x: -32.10, y: 20.09, z: 16.45 }, target: { x: 2232, y: 220, z: 0 }, zoom: 2.34 }
};

let currentZoneIndex = 0;
window.currentZoneIndex = currentZoneIndex;
let globalCamera, globalAnimateCamera;
let addItemLabel;
export function setupInteractions(scene, camera, renderer, mixers, getZoneCenter) {
  globalCamera = camera;
  globalAnimateCamera = animateCameraAndTarget;
  const { hudContainer, plusButton, menu, skipButton, nextDayIcon } = createHUD();
  updatePlusButtonPosition(plusButton, camera, renderer, getZoneCenter, () => currentZoneIndex);
  plusButton.onclick = () => {
    playSound('click_003.mp3');
    addItemLabel.style.opacity = '0';
    setTimeout(() => { addItemLabel.remove(); }, 500);
    const zones = ["zone1", "zone2", "zone3"];
    const currentZone = zones[currentZoneIndex];
    const target = customCameraCoordinates[currentZone];
    animateCameraAndTarget(camera, target.pos, target.zoom, target.target, 10, () => {
      menu.innerHTML = "";
      menu.style.left = plusButton.style.left;
      menu.style.top = plusButton.style.top;
      menu.style.display = 'block';
      const zoneItems = {
        zone1: [{ model: 'tomato_3', preview: '/assets/tomato.png' }, { model: 'corn_3', preview: '/assets/corn.png' }],
        zone2: [{ model: 'grape_3', preview: '/assets/grape.png' }, { model: 'strawberry_3', preview: '/assets/strawberry.png' }],
        zone3: [{ model: 'sheep_1', preview: '/assets/sheep.png' }, { model: 'cow_1', preview: '/assets/cow.png' }]
      };
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
                transitionToNight(scene, 1500);
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
                transitionToNight(scene, 500);
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
    transitionToDay(scene, 2000);
    if (currentZoneIndex < 2) {
      currentZoneIndex++;
      window.currentZoneIndex = currentZoneIndex;
      const zones = ["zone1", "zone2", "zone3"];
      const nextZone = zones[currentZoneIndex];
      const target = customCameraCoordinates[nextZone];
      animateCameraAndTarget(camera, target.pos, target.zoom, target.target, 1000, () => { plusButton.style.display = 'block'; });
    }
  };

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

  window.addEventListener('resize', () => {
    updatePlusButtonPosition(plusButton, camera, renderer, getZoneCenter, () => currentZoneIndex);
  });

  window.showPlusButton = function() {
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
      setTimeout(() => { addItemLabel.style.opacity = '1'; }, 100);
      const zones = ["zone1", "zone2", "zone3"];
      const zone = zones[0];
      const target = customCameraCoordinates[zone];
      animateCameraAndTarget(camera, target.pos, target.zoom, target.target, 1000);
      currentZoneIndex = 0;
      window.currentZoneIndex = 0;
    }
  }
}
