import * as THREE from 'three';

export function animateCameraAndTarget(camera, targetPos, targetZoom, targetLookAt, duration, callback) {
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

export function transitionToNight(scene, duration) {
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

export function transitionToDay(scene, duration) {
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
