import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
            const clone = chicken.clone();
            const baseY = bbox.min.y + 0.5;
            const offset = -0.5;
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
