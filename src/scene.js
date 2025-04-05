import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as SkeletonClone } from '../node_modules/three/examples/jsm/utils/SkeletonUtils.js';

const heightAdjustments = {
  cow_1: -0.5,
  sheep_1: -0.5,
  chicken_1: -0.5
};

function bounceEaseOut(t) {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    t -= 1.5 / 2.75;
    return 7.5625 * t * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75;
    return 7.5625 * t * t + 0.9375;
  } else {
    t -= 2.625 / 2.75;
    return 7.5625 * t * t + 0.984375;
  }
}

function animateGrowth(mainObj, groundObj, offset) {
  const groundFinalY = groundObj.userData.finalY;
  const groundDuration = 500;
  const objectDuration = 500;
  let startTime = null;
  function animateGround(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    let t = Math.min(elapsed / groundDuration, 1);
    const easeT = bounceEaseOut(t);
    groundObj.position.y = (groundFinalY - offset) + offset * easeT;
    if (t < 1) {
      requestAnimationFrame(animateGround);
    } else {
      let startTime2 = null;
      function animateMain(timestamp2) {
        if (!startTime2) startTime2 = timestamp2;
        const elapsed2 = timestamp2 - startTime2;
        let t2 = Math.min(elapsed2 / objectDuration, 1);
        const easeT2 = 1 - Math.pow(1 - t2, 2);
        mainObj.scale.set(easeT2, easeT2, easeT2);
        if (t2 < 1) {
          requestAnimationFrame(animateMain);
        } else {
          mainObj.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) child.material.needsUpdate = true;
            }
          });
        }
      }
      requestAnimationFrame(animateMain);
    }
  }
  requestAnimationFrame(animateGround);
}

function animateFall(object, startY, targetY, duration) {
  let startTime = null;
  function fallAnimation(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easeT = bounceEaseOut(t);
    object.position.y = startY - (startY - targetY) * easeT;
    if (t < 1) {
      requestAnimationFrame(fallAnimation);
    } else {
      object.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.needsUpdate = true;
        }
      });
    }
  }
  requestAnimationFrame(fallAnimation);
}

export function loadGround(scene, mixers) {
  const loader = new GLTFLoader();
  loader.load('/assets/ground.glb', (gltf) => {
    const ground = gltf.scene;
    ground.position.set(0, 0, 0);
    ground.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.side = THREE.DoubleSide;
      }
    });
    scene.add(ground);
  }, undefined, (error) => {
    console.error('Error loading ground.glb:', error);
  });
  loader.load('/assets/zones.glb', (gltf) => {
    const zones = gltf.scene;
    zones.position.set(0, 0, 0);
    zones.scale.set(0.01, 0.01, 0.01);
    zones.traverse(child => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.material.side = THREE.DoubleSide;
        child.material.opacity = 0;
        child.material.transparent = true;
      }
    });
    scene.add(zones);
    let zone4 = null;
    zones.traverse(child => { if (child.name === "zone4") { zone4 = child; } });
    if (zone4) {
      zone4.updateWorldMatrix(true, true);
      const bbox = new THREE.Box3().setFromObject(zone4);
      const min = bbox.min;
      const max = bbox.max;
      const loader2 = new GLTFLoader();
      loader2.load('/assets/objects.glb', (gltfObjects) => {
        const objectsScene = gltfObjects.scene;
        const animations = gltfObjects.animations;
        let chicken = null;
        objectsScene.traverse(child => { if (child.name === "chicken_1") { chicken = child; } });
        if (chicken) {
          const placedChickens = [];
          for (let i = 0; i < 5; i++) {
            let posCandidate;
            let posX, posZ;
            do {
              posX = THREE.MathUtils.lerp(min.x, max.x, Math.random());
              posZ = THREE.MathUtils.lerp(min.z, max.z, Math.random());
              posCandidate = new THREE.Vector2(posX, posZ);
            } while (placedChickens.some(existing => existing.distanceTo(posCandidate) < 1));
            placedChickens.push(posCandidate);
            const clone = SkeletonClone(chicken);
            const baseY = bbox.min.y + 0.5;
            const offset = heightAdjustments['chicken_1'] || 0;
            const posY = baseY + offset;
            clone.position.set(posCandidate.x, posY, posCandidate.y);
            clone.rotation.y = Math.random() * Math.PI * 2;
            clone.castShadow = true;
            clone.receiveShadow = true;
            clone.updateMatrixWorld(true);
            clone.traverse(child => {
              if (child.isSkinnedMesh && child.skeleton && child.skeleton.bones) {
                child.skeleton.bones.forEach(bone => { if (bone) bone.updateMatrixWorld(true); });
              }
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) child.material.needsUpdate = true;
              }
            });
            scene.add(clone);
            if (animations && animations.length > 0 && mixers) {
              const mixer = new THREE.AnimationMixer(clone);
              animations.forEach(animation => {
                const action = mixer.clipAction(animation);
                action.timeScale = 0.5 + Math.random();
                action.play();
              });
              mixers.push(mixer);
            }
          }
        } else {
          console.error("chicken_1 not found in objects.glb");
        }
      }, undefined, (error) => {
        console.error("Error loading objects.glb:", error);
      });
    } else {
      console.error("zone4 not found in zones.glb");
    }
  }, undefined, (error) => {
    console.error('Error loading zones.glb:', error);
  });
}

export function placeGridObjects(scene, zoneName, modelName, mixers) {
  let zone = null;
  scene.traverse(child => { if (child.name === zoneName) zone = child; });
  if (!zone) {
    console.error(zoneName + " not found");
    return;
  }
  zone.updateWorldMatrix(true, true);
  const bbox = new THREE.Box3().setFromObject(zone);
  const min = bbox.min;
  const max = bbox.max;
  const cols = 3;
  const rows = 3;
  const loader = new GLTFLoader();
  loader.load('/assets/objects.glb', (gltf) => {
    const objectsScene = gltf.scene;
    let model = null;
    objectsScene.traverse(child => { if (child.name === modelName) model = child; });
    if (!model) {
      console.error(modelName + " not found in objects.glb");
      return;
    }
    const growthModels = new Set(["tomato_3", "corn_3", "grape_3", "strawberry_3"]);
    let groundModel = null;
    if (growthModels.has(modelName)) {
      objectsScene.traverse(child => { if (child.name === "ground1") groundModel = child; });
    }
    const width = max.x - min.x;
    const depth = max.z - min.z;
    const spacingX = width / (cols + 1);
    const spacingZ = depth / (rows + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let clone;
        if (modelName === 'cow_1' || modelName === 'sheep_1') {
          clone = modelName === 'sheep_1' ? model.clone(true) : SkeletonClone(model);
        } else {
          clone = model.clone();
        }
        const posX = min.x + spacingX * (c + 1);
        const posZ = min.z + spacingZ * (r + 1);
        const baseY = bbox.min.y + 0.5;
        let posY = baseY;
        if (modelName === 'cow_1' || modelName === 'sheep_1') {
          posY = baseY + (heightAdjustments[modelName] || 0);
        }
        clone.position.set(posX, posY, posZ);
        clone.rotation.y = Math.random() * Math.PI * 2;
        clone.castShadow = true;
        clone.receiveShadow = true;
        if (growthModels.has(modelName) && groundModel) {
          clone.scale.set(0, 0, 0);
          const groundClone = groundModel.clone();
          groundClone.position.set(posX, posY, posZ);
          groundClone.castShadow = true;
          groundClone.receiveShadow = true;
          const offset = 1;
          groundClone.position.y = posY - offset;
          groundClone.userData.finalY = posY;
          groundClone.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) child.material.needsUpdate = true;
            }
          });
          scene.add(groundClone);
          scene.add(clone);
          animateGrowth(clone, groundClone, offset);
        } else if (modelName === 'cow_1' || modelName === 'sheep_1') {
          const fallOffset = 10;
          clone.position.y = posY + fallOffset;
          clone.updateMatrixWorld(true);
          clone.frustumCulled = false;
          clone.traverse(child => {
            if (child.isSkinnedMesh && child.skeleton && child.skeleton.bones) {
              child.skeleton.bones.forEach(bone => { if (bone) bone.updateMatrixWorld(true); });
            }
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) child.material.needsUpdate = true;
            }
          });
          scene.add(clone);
          animateFall(clone, posY + fallOffset, posY, 800);
        } else {
          clone.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) child.material.needsUpdate = true;
            }
          });
          scene.add(clone);
        }
        if ((modelName === 'cow_1' || modelName === 'sheep_1') &&
            gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(clone);
          gltf.animations.forEach(animation => {
            const action = mixer.clipAction(animation);
            action.play();
          });
          mixers.push(mixer);
        }
      }
    }
  }, undefined, (error) => {
    console.error("Error loading objects.glb:", error);
  });
}

export function placeCenterObject(scene, zoneName, modelName, mixers) {
  if (modelName === 'sheep_1') return;
  let zone = null;
  scene.traverse(child => { if (child.name === zoneName) zone = child; });
  if (!zone) {
    console.error(zoneName + " not found");
    return;
  }
  zone.updateWorldMatrix(true, true);
  const bbox = new THREE.Box3().setFromObject(zone);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const loader = new GLTFLoader();
  loader.load('/assets/objects.glb', (gltf) => {
    const objectsScene = gltf.scene;
    let model = null;
    objectsScene.traverse(child => { if (child.name === modelName) model = child; });
    if (!model) {
      console.error(modelName + " not found in objects.glb");
      return;
    }
    let clone;
    clone = modelName === 'cow_1' ? SkeletonClone(model) : model.clone();
    clone.position.copy(center);
    const baseY = bbox.min.y + 0.5;
    const targetY = baseY + (heightAdjustments[modelName] || 0);
    const fallOffset = 10;
    clone.position.y = targetY + fallOffset;
    clone.updateMatrixWorld(true);
    clone.frustumCulled = false;
    clone.traverse(child => {
      if (child.isSkinnedMesh && child.skeleton && child.skeleton.bones) {
        child.skeleton.bones.forEach(bone => { if (bone) bone.updateMatrixWorld(true); });
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) child.material.needsUpdate = true;
      }
    });
    scene.add(clone);
    animateFall(clone, targetY + fallOffset, targetY, 800);
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clone);
      gltf.animations.forEach(animation => {
        const action = mixer.clipAction(animation);
        action.play();
      });
      mixers.push(mixer);
    }
  }, undefined, (error) => {
    console.error("Error loading objects.glb:", error);
  });
}

export function placeSheepObject(scene, zoneName, mixers) {
  let zone = null;
  scene.traverse(child => { if (child.name === zoneName) zone = child; });
  if (!zone) {
    console.error(zoneName + " not found");
    return;
  }
  zone.updateWorldMatrix(true, true);
  const bbox = new THREE.Box3().setFromObject(zone);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const loader = new GLTFLoader();
  loader.load('/assets/sheep.glb', (gltf) => {
    const model = gltf.scene;
    if (!model) {
      console.error("sheep model not found in sheep.glb");
      return;
    }
    const clone = model.clone();
    const zoneSize = new THREE.Vector3();
    bbox.getSize(zoneSize);
    const sheepBox = new THREE.Box3().setFromObject(clone);
    const sheepSize = new THREE.Vector3();
    sheepBox.getSize(sheepSize);
    const maxZoneDimension = Math.min(zoneSize.x, zoneSize.z);
    const maxSheepDimension = Math.max(sheepSize.x, sheepSize.z);
    const scaleFactor = (maxZoneDimension * 0.5) / maxSheepDimension;
    clone.scale.multiplyScalar(scaleFactor);
    clone.position.copy(center);
    const baseY = bbox.min.y;
    const fallOffset = 10;
    clone.position.y = baseY + fallOffset;
    clone.updateMatrixWorld(true);
    clone.frustumCulled = false;
    scene.add(clone);
    animateFall(clone, baseY + fallOffset, baseY, 800);
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clone);
      gltf.animations.forEach(animation => {
        const action = mixer.clipAction(animation);
        action.play();
      });
      mixers.push(mixer);
    }
  }, undefined, (error) => {
    console.error("Error loading sheep.glb:", error);
  });
}
