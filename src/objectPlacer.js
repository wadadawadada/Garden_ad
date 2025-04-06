import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as SkeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { animateGrowth, animateFall } from './animations.js';

const heightAdjustments = {
  cow_1: -0.5,
  sheep_1: -0.5,
  chicken_1: -0.5
};

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
          if (modelName === "tomato_3") {
            groundClone.scale.set(1, 0.7, 1.4);
          }
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
