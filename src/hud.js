export function createHUD() {
    const hudContainer = document.createElement('div');
    hudContainer.style.position = 'absolute';
    hudContainer.style.top = '0';
    hudContainer.style.left = '0';
    hudContainer.style.width = '100%';
    hudContainer.style.height = '100%';
    hudContainer.style.pointerEvents = 'none';
    hudContainer.style.zIndex = '10';
    document.body.appendChild(hudContainer);
  
    const plusButton = document.createElement('img');
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
        width: 250px !important;
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
  
    return { hudContainer, plusButton, menu, skipButton, nextDayIcon };
  }
  
  export function updatePlusButtonPosition(plusButton, camera, renderer, getZoneCenter, currentZoneIndex) {
    const index = (typeof window.currentZoneIndex === 'number') ? window.currentZoneIndex : currentZoneIndex;
    const zones = ["zone1", "zone2", "zone3"];
    const currentZone = zones[index];
    const center = getZoneCenter(currentZone);
    const vector = center.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    plusButton.style.left = (x - 50) + 'px';
    plusButton.style.top = (y - 50) + 'px';
    requestAnimationFrame(() => updatePlusButtonPosition(plusButton, camera, renderer, getZoneCenter, currentZoneIndex));
  }
  