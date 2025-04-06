import * as THREE from 'three';

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

export function animateGrowth(mainObj, groundObj, offset) {
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
        if (mainObj.name === "tomato_3" || mainObj.name === "corn_3") {
          const rotationSpeed = Math.PI * 2; 
          mainObj.rotation.y = easeT2 * rotationSpeed;
        }
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

export function animateFall(object, startY, targetY, duration) {
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
